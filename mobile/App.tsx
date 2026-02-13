import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const API_URL = "https://yh9fp9463n.us-east-1.awsapprunner.com";

export default function App() {
  const [jsonInput, setJsonInput] = useState('{"name": "test"}');
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [pushError, setPushError] = useState("");

  const [fetchId, setFetchId] = useState("");
  const [fetchResult, setFetchResult] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState("");

  async function handlePush() {
    setPushError("");
    setPushResult(null);
    try {
      const body = JSON.parse(jsonInput);
      const res = await fetch(`${API_URL}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPushResult(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
      setPushError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleFetch() {
    setFetchError("");
    setFetchResult(null);
    try {
      const res = await fetch(`${API_URL}/data/${fetchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFetchResult(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Coframe Data</Text>

        {/* Push Data */}
        <Text style={styles.sectionTitle}>Push Data</Text>
        <TextInput
          style={styles.textArea}
          value={jsonInput}
          onChangeText={setJsonInput}
          placeholder='{"key": "value"}'
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity style={styles.buttonPrimary} onPress={handlePush}>
          <Text style={styles.buttonText}>Push Data</Text>
        </TouchableOpacity>
        {pushError ? <Text style={styles.error}>{pushError}</Text> : null}
        {pushResult ? <Text style={styles.result}>{pushResult}</Text> : null}

        {/* Fetch Data */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
          Fetch Data
        </Text>
        <TextInput
          style={styles.input}
          value={fetchId}
          onChangeText={setFetchId}
          placeholder="Enter item ID..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={[styles.buttonSecondary, !fetchId && styles.buttonDisabled]}
          onPress={handleFetch}
          disabled={!fetchId}
        >
          <Text style={styles.buttonText}>Fetch</Text>
        </TouchableOpacity>
        {fetchError ? <Text style={styles.error}>{fetchError}</Text> : null}
        {fetchResult ? <Text style={styles.result}>{fetchResult}</Text> : null}
      </ScrollView>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f4f4f5",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f4f4f5",
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: "#18181b",
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: "#f4f4f5",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#18181b",
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: "#f4f4f5",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "#3f3f46",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#f4f4f5",
    fontWeight: "600",
    fontSize: 16,
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    marginTop: 8,
  },
  result: {
    backgroundColor: "#18181b",
    borderColor: "#3f3f46",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: "#f4f4f5",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    marginTop: 12,
  },
});
