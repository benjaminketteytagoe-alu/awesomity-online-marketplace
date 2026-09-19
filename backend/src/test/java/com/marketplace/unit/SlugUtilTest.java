package com.marketplace.unit;

import com.marketplace.common.SlugUtil;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SlugUtilTest {

    @Test
    void simpleLowercase() {
        assertThat(SlugUtil.slugify("Electronics")).isEqualTo("electronics");
    }

    @Test
    void spacesBecomeDashes() {
        assertThat(SlugUtil.slugify("Home & Garden")).isEqualTo("home-garden");
    }

    @Test
    void unicodeAccentsAreNormalized() {
        assertThat(SlugUtil.slugify("Café d'été")).isEqualTo("cafe-d-ete");
    }

    @Test
    void symbolsAreStripped() {
        assertThat(SlugUtil.slugify("C++ for Pros")).isEqualTo("c-for-pros");
    }

    @Test
    void multipleSpacesCollapse() {
        assertThat(SlugUtil.slugify("a    b")).isEqualTo("a-b");
    }

    @Test
    void leadingAndTrailingDashesAreTrimmed() {
        assertThat(SlugUtil.slugify("---Hello---")).isEqualTo("hello");
    }

    @Test
    void blankInputReturnsEmpty() {
        assertThat(SlugUtil.slugify("")).isEmpty();
        assertThat(SlugUtil.slugify("   ")).isEmpty();
        assertThat(SlugUtil.slugify(null)).isEmpty();
    }
}
