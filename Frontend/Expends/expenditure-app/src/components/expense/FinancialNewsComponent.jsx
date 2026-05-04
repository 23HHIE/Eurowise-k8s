import React, { useEffect, useState } from 'react';
import { Form, Card, Button } from 'react-bootstrap';
import { retrieveFinancialNewsApi } from './api/FinancialNews'

// Define the logic of the financial component
const FinancialNewsComponent = () => {

    // Create a variable to store the status of newsData
    const [newsData, setNewsData] = useState(null)

    // Define the logic of the page rendering
    useEffect(() => {

        // Define the logic of the fetchData using async request
        const fetchData = async () => {
            try {

                // Create a variable to store the response from calling the retrieve financial news API
                const response = await retrieveFinancialNewsApi()
                // Update the data of the response to the status of the newsData
                setNewsData(response.data)
            } catch (error) {
                // Handle the error event
                console.error('Error message: ', error)
            }
        }

        // Call the fetchData method
        fetchData();
    }, []

    )

    return (

        <Form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>Financial News</h2>

            {newsData ? (
                // Rendering the content of news
                <div className="news-container">
                    {newsData.map((news, index) => (
                        // Create card to showcase the content of news in sequence
                        <Card key={index} className="news-card">
                            {/* Rendering the image of each news */}
                            <Card.Img variant="top" src={news.thumbnailUrl} className="card-image" />
                            <Card.Body>
                                {/* Rendering the title of each news */}
                                <Card.Title className="card-title">{news.headline}</Card.Title>
                                {/* Use a buttion to link to the detail page of targeted news  */}
                                <Button variant="primary" href={news.url} target="_blank" className="read-more-btn">
                                    Read More
                                </Button>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            ) : (
                // Display a page if no news available
                <p>No news data available.</p>
            )}
        </Form>
    );
};


export default FinancialNewsComponent;
