package com.hui.rest.webservices.restfulwebservices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class RestfulWebServicesApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestfulWebServicesApplication.class, args);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer(){
		//Create a WebMvcConfigurer instance to configure the CORS
		return new WebMvcConfigurer() {
			public void addCorsMappings(CorsRegistry registry) {
				//Allow all the methods and requests from the localhost3000
				registry.addMapping("/**")
						.allowedMethods("*").allowedOrigins("http://localhost:3000");
			}
		};
	}

}
