package com.marketplace.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste the access token returned by POST /api/auth/login"
)
public class OpenApiConfig {

    @Bean
    public OpenAPI marketplaceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Marketplace API")
                        .description("""
                                RESTful API for an online marketplace where shoppers buy products,
                                sellers manage stores, and admins govern the platform.

                                **Auth:** All endpoints except public reads require a JWT
                                Bearer token in the `Authorization` header. Click Authorize
                                above after calling `POST /api/auth/login`.

                                **Roles:** ADMIN, SHOPPER, SELLER — enforced via
                                `@PreAuthorize` on protected routes.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Marketplace Engineering")
                                .email("eng@marketplace.local"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local dev")
                ));
    }
}
