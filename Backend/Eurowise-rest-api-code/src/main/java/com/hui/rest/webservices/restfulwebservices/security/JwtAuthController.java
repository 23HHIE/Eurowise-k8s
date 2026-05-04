package com.hui.rest.webservices.restfulwebservices.security;

import com.hui.rest.webservices.restfulwebservices.dto.AuthResponse;
import com.hui.rest.webservices.restfulwebservices.dto.LoginRequest;
import com.hui.rest.webservices.restfulwebservices.dto.RegisterRequest;
import com.hui.rest.webservices.restfulwebservices.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;


//Controller class to handle the request for authentication
@RestController
@RequiredArgsConstructor

public class JwtAuthController {

    //Dependency injection
    private final AuthService authService;

    //Process the POST method for user register and return the result of a successful response
    @PostMapping("/auth/signup")
    public Response register(@RequestBody RegisterRequest registerRequest){

        AuthResponse authResponse = authService.register(registerRequest);
        return Response.success(authResponse);
    }


    //Process the POST method for user login
    @PostMapping("/authenticate")
    public Response<AuthResponse> login(@RequestBody LoginRequest loginRequest){
        //Invoke the login service
        return Response.success(authService.login(loginRequest));

    }


    //Process the POST method for user logout
    @PostMapping("/auth/logout")
    public Response logout(@RequestParam  String sessionId){
        //Invoke the logout service
        return Response.success(null);
    }
}