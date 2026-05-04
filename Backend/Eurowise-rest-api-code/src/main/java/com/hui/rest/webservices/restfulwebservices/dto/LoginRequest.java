package com.hui.rest.webservices.restfulwebservices.dto;


import lombok.Data;

//Data transfer object to describe the login request
@Data
public class LoginRequest {

    //Credential containing the username
    private String username;

    //Credential containing the password
    private String password;
}