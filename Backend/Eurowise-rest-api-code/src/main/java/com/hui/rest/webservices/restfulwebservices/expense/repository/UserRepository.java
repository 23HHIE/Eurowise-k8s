package com.hui.rest.webservices.restfulwebservices.expense.repository;


import com.hui.rest.webservices.restfulwebservices.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

//User repository interface to retrieve user details entity
@Repository
public interface UserRepository extends JpaRepository <User, Long>{

    //To retrieve a user object by given username and password
    User findByNameAndPassword(String username, String password);

    //To retrieve a user object by given username
    User findByName(String username);

    //To retrieve a list of users by given user status
    List<User> findAllByStatus(int status);
}