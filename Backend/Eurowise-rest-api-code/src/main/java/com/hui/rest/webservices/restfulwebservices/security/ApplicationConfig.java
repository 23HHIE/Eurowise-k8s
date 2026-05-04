package com.hui.rest.webservices.restfulwebservices.security;


import com.hui.rest.webservices.restfulwebservices.expense.repository.UserRepository;
import com.hui.rest.webservices.restfulwebservices.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;


//Configuration class of authentication-related Beans
@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    //Dependency injection
    private final UserRepository userRepository;

    //Define the logic of the AuthenticationProvider Bean
    @Bean
    public AuthenticationProvider authenticationProvider() throws Exception {

        //Declare a DaoAuthenticationProvider to store the credentials
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        //Update the data of user details service and the password encoder
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    //Get the AuthenticationManager from the AuthenticationProvider Bean
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    //Define a PasswordEncoder Bean
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    //Define a UserDetailsService Bean
    @Bean
    public UserDetailsService userDetailsService(){
        return username -> {
            User user = userRepository.findByName(username);
            if(user == null) {
                throw new UsernameNotFoundException("Username doesn't exist.");
            }
            return user;
        };
    }
}