import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import { Input, Card, ListItem, Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [fromLang, setFromLang] = useState('es-ES');
  const [toLang, setToLang] = useState('EN');
  const [darkMode, setDarkMode] = useState(false);

  const languages = [
    { value: 'es-ES', label: 'Español', dl: 'ES' },
    { value: 'en-US', label: 'Inglés', dl: 'EN' },
    { value: 'fr-FR', label: 'Francés', dl: 'FR' },
    { value: 'de-DE', label: 'Alemán', dl: 'DE' },
    { value: 'it-IT', label: 'Italiano', dl: 'IT' },
    { value: 'pt-PT', label: 'Portugués', dl: 'PT' },
  ];

  useEffect(() => {
    loadSettings();
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechError = handleSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [toLang]);

  const loadSettings = async () => {
    try {
      const savedFrom = await AsyncStorage.getItem('fromLang');
      const savedTo = await AsyncStorage.getItem('toLang');
      const savedDark = await AsyncStorage.getItem('darkMode');

      if (savedFrom) setFromLang(savedFrom);
      if (savedTo) setToLang(savedTo);
      if (savedDark) setDarkMode(savedDark === 'true');
    } catch (e) {
      console.error('Error al cargar ajustes');
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Error al guardar:', e);
    }
  };

  const handleSpeechResults = (e: any) => {
    const text = e.value?.[0] || '';
    setOriginalText(text);
    if (text.trim()) {
      translateText(text, toLang);
    }
  };

  const handleSpeechError = (e: any) => {
    console.error('Error:', e.error);
    Alert.alert('Error', 'No se pudo reconocer el audio: ' + e.error.message);
  };

  const startListening = async () => {
    try {
      await Voice.start(fromLang.split('-')[0]);
      setIsListening(true);
      setOriginalText('Escuchando...');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el micrófono');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error(error);
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': 'DeepL-Auth-Key 9d5e7818-fde9-4d7c-8c6c-cf004e838625:fx',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `text=${encodeURIComponent(text)}&target_lang=${targetLang}`,
      });

      const data = await response.json();
      const translation = data.translations[0].text;
      setTranslatedText(translation);

      // Leer en voz alta
      Speech.speak(translation, {
        language: targetLang.toLowerCase(),
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error: any) {
      console.error('Error traducción:', error);
      setTranslatedText('Error al traducir');
    }
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    saveSetting('darkMode', String(newValue));
  };

  const selectToLang = (lang: string) => {
    setToLang(lang);
    saveSetting('toLang', lang);
  };

  const currentLang = languages.find(l => l.value === fromLang)?.label || 'Desconocido';
  const targetLangLabel = languages.find(l => l.dl === toLang)?.label || 'Desconocido';

  const theme = darkMode ? styles.dark : styles.light;

  return (
    <SafeAreaView style={[styles.container, theme.bg]}>
      <ScrollView>
        <Card containerStyle={[theme.card, { margin: 0, borderRadius: 16 }]}>
          <Card.Title style={theme.text}>🎙️ Traductor IA</Card.Title>
          <Card.Divider />

          <ListItem bottomDivider>
            <Icon name="mic" type="material" color="#3498db" />
            <ListItem.Content>
              <ListItem.Title style={theme.text}>Decir en:</ListItem.Title>
              <ListItem.Subtitle style={theme.text}>{currentLang}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>

          <ListItem bottomDivider>
            <Icon name="translate" type="material" color="#2ecc71" />
            <ListItem.Content>
              <ListItem.Title style={theme.text}>Traducir a:</ListItem.Title>
              <ListItem.Subtitle style={theme.text}>{targetLangLabel}</ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>

          <View style={styles.buttonRow}>
            <Button
              title={isListening ? "🔴 Detener" : "🟢 Iniciar"}
              color={isListening ? "#c0392b" : "#27ae60"}
              onPress={isListening ? stopListening : startListening}
            />
          </View>

          <View style={styles.output}>
            <Text style={[styles.label, theme.text]}>Original:</Text>
            <Text style={[styles.text, theme.output]}>{originalText || 'Esperando audio...'}</Text>

            <Text style={[styles.label, theme.text]}>Traducción:</Text>
            <Text style={[styles.text, theme.output]}>{translatedText || 'Traducción aquí...'}</Text>
          </View>
        </Card>

        <Card containerStyle={[theme.card, { margin: 0, borderRadius: 16 }]}>
          <Card.Title style={theme.text}>🔧 Idiomas</Card.Title>
          <View style={styles.langRow}>
            {languages.map((lang) => (
              <Button
                key={lang.dl}
                title={lang.dl}
                onPress={() => selectToLang(lang.dl)}
                color={toLang === lang.dl ? '#e74c3c' : '#3498db'}
              />
            ))}
          </View>
        </Card>

        <View style={styles.settings}>
          <Text style={theme.text}>Modo oscuro</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>

        <Text style={[styles.footer, theme.text]}>
          Usando DeepL API • Clave: fx
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buttonRow: {
    marginVertical: 15,
    alignItems: 'center',
  },
  output: {
    marginVertical: 15,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 15,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  settings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 20,
  },
  light: {
    bg: { backgroundColor: '#fff' },
    card: {},
    text: { color: '#2c3e50' },
    output: { color: '#2c3e50' },
  },
  dark: {
    bg: { backgroundColor: '#121212' },
    card: { backgroundColor: '#1e1e1e' },
    text: { color: '#ffffff' },
    output: { color: '#e0e0e0', backgroundColor: '#333' },
  },
});