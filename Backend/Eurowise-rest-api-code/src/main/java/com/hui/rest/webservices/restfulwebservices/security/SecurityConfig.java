package com.hui.rest.webservices.restfulwebservices.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

//Configuration class for Spring Security
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    //Dependency injection
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    //Define a Bean to configure the SecurityFilterChain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                //Disable the Cross Site Request Forgery protection
                .csrf().disable()
                //Initialize the CORS with the default configuration
                .cors(Customizer.withDefaults())
                //Configure the rule to authorize HTTP requests
                .authorizeHttpRequests()
                //Permit all requests
                .antMatchers("/**").permitAll()
                //Authenticate all requests
                .anyRequest().authenticated()
                .and()
                //Set the session policy to be stateless
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                //Configure the authentication provider
                .authenticationProvider(authenticationProvider)
                //Add the JWT authentication filter
                .addFilterAfter(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
