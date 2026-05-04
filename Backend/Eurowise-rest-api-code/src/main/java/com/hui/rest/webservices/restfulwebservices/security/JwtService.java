package com.hui.rest.webservices.restfulwebservices.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

//Service class to handle the services related to JSON Web Token
@Service
public class JwtService {

    //The secret key to authenticate the JWT
    private final String SECRET_KEY = "cap9oWOVv6er2gx2GtbuTV7Q58nh6Y8HOeL5amzsextjZyaGIhAFmUGPcpxOyDwalAA59D2dPcc2Fnc7MK0HHG//CBOXiNzcUB+e5QZtFtCEUWU2uQApsC9mVL7QXoLREYIuAXmGWvr48ZLSTWNB/DdaQi9hcTO5c2M0QRjjzilScDu/rlR41eAUl533VSbtDTcfAafaqtiiwKyHdRWmYNNyyVEt081OB5MJcKt7+11fJgHP1BMzvefqW6RRc/nXuys3FkSFwzGNGiYLGtFmAUWDD5gbbPk3PA5j7MBuQSNOF904XkK2JxauF1Gpv39l2acwd5R7b4nRKL5+tjnJjqeJDawuBB5uW2PCHdlR/uY=";

    //Extract the username from the token
    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }

    //Extract the claim from the token
    public <T> T extractClaim(String token, Function<Claims,T> claimsResolver){
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    //Simple method to generate the token concentrate on user details
    public String generateToken(UserDetails userDetails){
        return generateToken(new HashMap<>(), userDetails);
    }

    //Generate the token with more extended details
    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails){
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 24))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    //Validate if the token is valid
    public boolean isTokenValid(String token, UserDetails userDetails){
        //Declare a variable from extracting the username
        final String username = extractUsername(token);

        //Validate if the username matches the username stored in the repository or the token is expired
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    //Validate if the token is expired
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    //Retrieve the expiration date
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    //Retrieve the claims info from extracting the body of the token
    private Claims extractAllClaims(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    //Retrieve the sign key by transferring the original secret key to validate the JWT
    private Key getSignInKey() {
        byte[] keBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keBytes) ;
    }

}
