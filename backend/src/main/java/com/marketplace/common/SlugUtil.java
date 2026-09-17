package com.marketplace.common;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtil {

    private SlugUtil() {}

    /**
     * Convert a human name to a URL-safe slug:
     *   "Home & Garden" → "home-garden"
     *   "  Café d'été  " → "cafe-d-ete"
     *   "C++ for Pros"  → "c-for-pros"
     */
    public static String slugify(String input) {
        if (input == null || input.isBlank()) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }
}
