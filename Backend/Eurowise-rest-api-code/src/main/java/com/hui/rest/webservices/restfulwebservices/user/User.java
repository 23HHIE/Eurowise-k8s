package com.hui.rest.webservices.restfulwebservices.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hui.rest.webservices.restfulwebservices.expense.ExpenditureList;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;


// Define a JPA entity class to describe user details
@Entity(name = "user_details")
@Data
public class User implements UserDetails {

    // Default constructor
    public User() {
    }

    //Assign the id as the primary key of the entity
    @Id
    @GeneratedValue
    private Long id;

    //Validate the size of the attribute name
    @Size(min = 2, message = "Name should have at least 2 characters")
    private String name;

    //Validate the size of the attribute password
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
    private String email;
    private String role="USER";
    private int status;

    //To avoid the token to be persistent data in database
    @Getter
    @Transient
    private String token;

    //Build the data relationship between the user and expense as one-to-many
    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<ExpenditureList> expense;

    //Constructor with parameters
    public User(Long id, String name, String password, String email, String role) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    //Setters
    public void setPassword(String password) {
        this.password = password;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setExpense(List<ExpenditureList> expenseLists) {
        this.expense = expenseLists;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", password='" + password + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                '}';
    }

    public void setToken(String token) {
        this.token = token;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getUsername() {
        return name;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == 0;
    }
}
