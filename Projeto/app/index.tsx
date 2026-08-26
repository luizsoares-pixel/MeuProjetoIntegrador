import { router } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { supabase } from "../services/supabase";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function login() {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

    console.log(data);
    console.log(error);

    if (error) {
      alert(error.message);
      return;
    } else {

      router.push("/home");
    }

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


      {/* LOGO */}
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
            fontSize: 140,
            fontWeight: "bold",
            color: "rgba(212,175,55,0.08)",
            top: 0,
          }}
        >
          MD
        </Text>

        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 20,
            left: 90,
          }}
        />

        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 20,
            right: 90,
          }}
        />

        <MaterialCommunityIcons
          name="chef-hat"
          size={28}
          color="rgba(212,175,55,0.25)"
          style={{
            position: "absolute",
            top: 100,
            left: 70,
          }}
        />

        <MaterialCommunityIcons
          name="storefront"
          size={28}
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
            fontSize: 46,
            fontWeight: "bold",
            fontStyle: "italic",
            marginTop: 55,
            zIndex: 1,
          }}
        >
          Menu
        </Text>

        <View
          style={{
            width: 80,
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
            letterSpacing: 8,
            zIndex: 1,
          }}
        >
          DIGITAL
        </Text>

        <Text
          style={{
            color: "#d8c184",
            marginTop: 10,
            fontSize: 14,
            zIndex: 1,
          }}
        >
          Seu cardápio na palma da mão
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
          autoCapitalize="none"
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
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#d4af37",
          }}
        />

        <TouchableOpacity
          onPress={login}
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
            ENTRAR
          </Text>
        </TouchableOpacity>
      </View>

      {/* CADASTRO */}
      <View
        style={{
          marginTop: 25,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 14,
          }}
        >
          Não possui conta?
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/cadastro")}
        >
          <Text
            style={{
              color: "#d4af37",
              fontWeight: "bold",
              marginTop: 8,
              fontSize: 15,
            }}
          >
            Cadastre-se
          </Text>

        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}