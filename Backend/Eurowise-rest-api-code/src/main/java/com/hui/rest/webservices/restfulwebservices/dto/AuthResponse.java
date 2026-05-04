package com.hui.rest.webservices.restfulwebservices.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import java.time.LocalDateTime;


//Data transfer object to describe the authentication response
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String username;
    private String email;
    private String profile;
    private int status;
    private String role;
    @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss")
    private LocalDateTime ctime;
    private String token;
}