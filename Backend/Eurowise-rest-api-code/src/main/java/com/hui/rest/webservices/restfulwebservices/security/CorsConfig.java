package com.hui.rest.webservices.restfulwebservices.security;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

//Configuration class of CORS
@Configuration
public class CorsConfig {

    //Read the allowed origins
    @Value("#{'${cors.allowed-origins}'.split(',')}")
    private List<String> allowedOrigins;

    //Read the allowed methods
    @Value("#{'${cors.allowed-methods}'.split(',')}")
    private List<String> allowedMethods;

    //Read the allowed headers
    @Value("#{'${cors.allowed-headers}'.split(',')}")
    private List<String> allowedHeaders;

    //Read the expected headers
    @Value("#{'${cors.exposed-headers}'.split(',')}")
    private List<String> expectedHeaders;

    //Define the logic of CorsConfigurationSource Bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        //Declare a new CorsConfiguration object
        CorsConfiguration configuration = new CorsConfiguration();

        //Set the allowed origins
        configuration.setAllowedOrigins(allowedOrigins);
        //Set the allowed methods
        configuration.setAllowedMethods(allowedMethods);
        //Set the allowed headers
        configuration.setAllowedHeaders(allowedHeaders);
        //Set the allowed headers
        configuration.setExposedHeaders(expectedHeaders);

        //Declare a new UrlBasedCorsConfigurationSource object for the CORS strategy
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        //Register all the created configuration
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}