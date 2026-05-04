import React, { useState } from 'react';
import { Form, FormControl, Button, Container, Row, Col } from 'react-bootstrap';

// Define the logic of the SearchBar component in terms of receiving onSearch function as a prop from the parent component
const SearchBar = ({ onSearch }) => {
    // Declare the state of the searchTerm in the current context
    const [searchTerm, setSearchTerm] = useState('');

    // Handle the search function
    const handleSearch = () => {
        // Declare a variable to store the value of input without blank
        const trimmedSearchTerm = searchTerm.trim();

        // Execute the onSearch function
        if (trimmedSearchTerm !== '') {
            onSearch(trimmedSearchTerm);
        }

    };

    return (
        <Container fluid>
            <Row className="justify-content-end">
                <Col xs="auto">
                    {/* Rendering the search function */}
                    <Form inline >
                        <FormControl
                            type="text"
                            placeholder="Search Type"
                            className="mr-sm-2 "
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="dark" onClick={handleSearch} className="ml-auto">
                            Search
                        </Button>
                    </Form>
                </Col>
            </Row>


        </Container>

    );
};

export default SearchBar;