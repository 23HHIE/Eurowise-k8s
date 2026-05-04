package com.hui.rest.webservices.restfulwebservices.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

//Component class to handle the JSON web token authentication
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    //Dependency injection
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    //Process to filter the JWT for validation
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        //Declare a final jwt to extract the header in a request processing
        final String jwt = request.getHeader("Authorization");

        //Continue the filter chain if the JWT is empty
        if(jwt == null){
            filterChain.doFilter(request, response);
            return;
        }

        //Extract the JWT token without the "Bearer "
        String jwtToken = jwt.substring(7);

        //Check the JWT token
        System.out.println("Received : " + jwtToken);

        //Declare a final string variable to store the username
        final String username;

        //Extract the username from the JWT token
        username = jwtService.extractUsername(jwtToken);

        //Set the authentication token to the context if the username is valid
        // and the context itself is not authenticated
        if(username != null && SecurityContextHolder.getContext().getAuthentication() == null){

            //Declare a UserDetails object to store the value of username extracted by the service
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            //Validate the token and the UserDetails by the service
            if(jwtService.isTokenValid(jwtToken, userDetails)){

                //Declare a UsernamePasswordAuthenticationToken to store the credentials
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                //Update the authentication details in the authentication token
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                //Update the authentication token in the current context
                SecurityContextHolder.getContext().setAuthentication(authToken);

                //Continue with next filter
                filterChain.doFilter(request, response);

            }
        }

    }
}