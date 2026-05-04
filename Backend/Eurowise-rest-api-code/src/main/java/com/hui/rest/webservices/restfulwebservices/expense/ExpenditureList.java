package com.hui.rest.webservices.restfulwebservices.expense;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hui.rest.webservices.restfulwebservices.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

//Define a JPA entity to describe the expense
@Entity(name = "expense")
public class ExpenditureList {

    //Default constructor
    public ExpenditureList(){}

    //Assign the id as the primary key of the entity
    @Id
    @GeneratedValue
    private Integer id;

    private String username;
    private String type;

    //Validate the value of fee amount must be a positive
    @Positive(message = "Enter a number greater than 0")
    private double fee;
    private LocalDate date;

    //Build the data relationship between the entity expense and the entity user
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private User user;

    //Constructor with parameters
    public ExpenditureList(Integer id, String username, String type, double fee, LocalDate date) {
        this.id = id;
        this.username = username;
        this.type = type;
        this.fee = fee;
        this.date = date;
    }

    //Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double getFee() {
        return fee;
    }

    public void setFee(double fee) {
        this.fee = fee;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
    @Override
    public String toString() {
        return "ExpenditureList{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", type='" + type + '\'' +
                ", fee=" + fee +
                ", date=" + date +
                '}';
    }
}
