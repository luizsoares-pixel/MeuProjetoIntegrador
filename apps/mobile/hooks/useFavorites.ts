import { useContext } from "react";
import {
  FavoritesContext,
  FavoritesContextData,
} from "../contexts/FavoritesContext";

export function useFavorites(): FavoritesContextData {
  const context = useContext(FavoritesContext);

  if (context === undefined) {
    throw new Error("useFavorites deve ser usado dentro de um FavoritesProvider");
  }

  return context;
}
