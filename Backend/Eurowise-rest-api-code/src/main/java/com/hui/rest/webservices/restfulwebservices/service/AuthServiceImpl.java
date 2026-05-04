package com.hui.rest.webservices.restfulwebservices.service;


import com.hui.rest.webservices.restfulwebservices.dto.AuthResponse;
import com.hui.rest.webservices.restfulwebservices.dto.LoginRequest;
import com.hui.rest.webservices.restfulwebservices.dto.RegisterRequest;
import com.hui.rest.webservices.restfulwebservices.expense.repository.UserRepository;
import com.hui.rest.webservices.restfulwebservices.security.JwtService;
import com.hui.rest.webservices.restfulwebservices.user.User;
import jakarta.annotation.Resource;
import org.springframework.beans.BeanUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;



//Service class to implement authentication operations
@Service
public class AuthServiceImpl implements AuthService {

    //Dependency injection
    @Resource
    private UserRepository userRepository;
    @Resource
    private PasswordEncoder passwordEncoder;
    @Resource
    private AuthenticationManager authenticationManager;
    @Resource
    private JwtService jwtService;


    //Process the logic of authentication for the user to register
    @Override
    public AuthResponse register(RegisterRequest registerRequest) {
        //Declare a new user object
        User user = new User();

        //Copy properties from register request class to the created user
        BeanUtils.copyProperties(registerRequest, user);

        //Set the password encoded by password encoder
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        //Default set of the role
        user.setRole("USER");

        //Save the user in the user repository
        user = userRepository.save(user);

        //Declare a new AuthResponse object
        var authResponse = new AuthResponse();

        //Copy properties from the saved user to the created authResponse
        BeanUtils.copyProperties(user, authResponse);

        //Generate a JWT token for the user
        String jwtToken = jwtService.generateToken(user);

        //Update the token for the authResponse
        authResponse.setToken(jwtToken);

        //Initiate the authentication by given credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getUsername(),
                        registerRequest.getPassword()
                )
        );
        return authResponse;
    }

    //Process the logic of authentication for the user to login
    @Override
    public AuthResponse login(LoginRequest loginRequest) {

        //Authenticate the credential
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        //Retrieve the user from the user repository by given username
        User user = userRepository.findByName(loginRequest.getUsername());

        //Generate a token for the user
        String jwtToken = jwtService.generateToken(user);

        //Declare a new authentication response
        AuthResponse authResponse = new AuthResponse();

        //Copy all properties from the user to the response
        BeanUtils.copyProperties(user, authResponse);

        //Update the generated token for the response
        authResponse.setToken(jwtToken);

        return authResponse;
    }
}