package com.hui.rest.webservices.restfulwebservices.service;

import com.hui.rest.webservices.restfulwebservices.dto.AuthResponse;
import com.hui.rest.webservices.restfulwebservices.dto.LoginRequest;
import com.hui.rest.webservices.restfulwebservices.dto.RegisterRequest;

//Interface to handle authentication service
public interface AuthService {

    //Register a new user by given user details
    AuthResponse register(RegisterRequest registerRequest);

    //Authenticate a user by given credentials
    AuthResponse login(LoginRequest loginRequest);
}
