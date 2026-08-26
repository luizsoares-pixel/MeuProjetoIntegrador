import { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";

import { supabase } from "../services/supabase";

import { router } from "expo-router";


import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
export default function Index() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function cadastrar() {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password: senha,
      });

    console.log(data);
    console.log(error);

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    Alert.alert(
      "Sucesso",
      "Usuário cadastrado!"
    );
  }

  return (
    <LinearGradient
      colors={[
        "#2f0000",
        "#4a0505",
        "#700000"
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        justifyContent: "flex-start",
        paddingTop: 120,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          alignItems: "center",
          marginBottom: 50,
          position: "relative",
          height: 180,
        }}
      >
        <Text
          style={{
            position: "absolute",
            fontSize: 130,
            fontWeight: "bold",
            color: "rgba(212,175,55,0.06)",
            top: 0,
            letterSpacing: 5,
          }}
        >
          MD
        </Text>

        <MaterialCommunityIcons
          name="map-marker-radius"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 20,
            left: 90,
          }}
        />

        <MaterialCommunityIcons
          name="compass-outline"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 20,
            right: 90,
          }}
        />

        <MaterialCommunityIcons
          name="store-search"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 100,
            left: 70,
          }}
        />

        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={30}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 100,
            right: 70,
          }}
        />

        <Text
          style={{
            color: "#d4af37",
            fontSize: 42,
            fontWeight: "bold",
            marginTop: 55,
            zIndex: 1,
          }}
        >
          Cadastro
        </Text>

        <View
          style={{
            width: 100,
            height: 2,
            backgroundColor: "#d4af37",
            marginVertical: 8,
            zIndex: 1,
          }}
        />

        <Text
          style={{
            color: "#FFF",
            fontSize: 16,
            letterSpacing: 5,
            zIndex: 1,
          }}
        >
          RESTAURANTES
        </Text>

        <Text
          style={{
            color: "#d8c184",
            marginTop: 10,
            fontSize: 14,
            zIndex: 1,
          }}
        >
          Descubra restaurantes próximos a você
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderWidth: 1,
          borderColor: "rgba(212,175,55,0.2)",
          borderRadius: 25,
          padding: 20,
        }}
      >


        <TextInput
          placeholder="Email"
          placeholderTextColor="#d8c184"
          value={email}
          onChangeText={setEmail}
          style={{
            backgroundColor: "#FFF",
            borderRadius: 15,
            paddingHorizontal: 18,
            paddingVertical: 15,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: "#d4af37",
          }}
        />

        <TextInput
          placeholder="Senha"
          placeholderTextColor="#d8c184"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          style={{
            backgroundColor: "#FFF",
            borderRadius: 15,
            paddingHorizontal: 18,
            paddingVertical: 15,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: "#d4af37",
          }}
        />
        <TouchableOpacity
          onPress={cadastrar}
          style={{
            backgroundColor: "#c4943e",
            borderRadius: 18,
            paddingVertical: 18,

            shadowColor: "#d4af37",
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.6,
            shadowRadius: 10,

            elevation: 8,
          }}
        >
          <Text
            style={{
              color: "#4a0505",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            CADASTRAR
          </Text>
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
}