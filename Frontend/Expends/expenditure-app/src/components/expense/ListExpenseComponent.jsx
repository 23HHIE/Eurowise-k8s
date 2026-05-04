import { useCallback, useEffect, useState } from "react"
import { Dropdown, DropdownButton, Container } from 'react-bootstrap';
import { deleteExpenseApi, retrieveAllExpensesForUsernameApi, updateExpenseApi } from "./api/ExpenseApiService"
import { useAuth } from "./security/AuthContext"
import { useNavigate } from "react-router-dom"
import SearchBar from "./SearchBar";

// Define the logic of the expense details component
function ListExpenseComponent() {
    // Declare a variable to store the authentication status
    const authContext = useAuth()
    // Declare a variable to store the value of username in the authenticated context
    const username = authContext.username
    // Initialize the useNavigate hook
    const navigate = useNavigate()
    // Declare a variable to store the state of the message
    const [message, setMessage] = useState(null)
    // Declare a variable to store the state of the refreshPage
    const [refreshPage, setRefreshPage] = useState(false)
    // Declare a variable to store the state of the details
    const [details2, setDetails2] = useState([])
    // Declare a variable to store the state of the currency exchange
    const [currency, setCurrency] = useState('EUR')
    // Declare a variable to store the state of the type of the expense
    const [type, setType] = useState('');
    // Declare a variable to store the state of the selectedCurrency
    const [selectedCurrency, setSelectedCurrency] = useState('')

    // Declare a callback function with an async method and store the result to a variable
    const refreshExpenses = useCallback(async () => {
        try {
            // Declare a variable to store the response after calling the API with parameters
            const internalResponse = await retrieveAllExpensesForUsernameApi(username, type, currency);
            // Logging the data to check
            console.log('Internal API Response:', internalResponse.data);
            // Update the state of details with the response generated
            setDetails2(internalResponse.data);
        } catch (error) {
            // Handle the error event
            console.log('Error:', error);
        }
        // Declare the dependecis
    }, [username, type, currency]);

    // Define the logic of the expense details table rendering
    useEffect(() => {
        // Call the function to retrieve details
        refreshExpenses();
        // Log the data
        console.log('Received type:', type)
        // Declare the page rendering during the changes of dependencies
    }, [username, type, currency, refreshPage]);


    // Define the logic to implement the search function
    const handleSearch = (searchTerm) => {
        // Log the input value
        console.log('Received Search Term:', searchTerm);
        // Update the state of the expense type with the value entered
        setType(searchTerm);
    }

    // Define the logic to process the drop down menu of currency exchange
    const handleCurrencyChange = (newCurrency) => {
        // Log the chosen currency
        console.log('Selected Currency:', newCurrency);
        // Update the state of the chosen currency in current context
        setCurrency(newCurrency);

    };

    // Define the deletion function
    function deleteExpense(id) {
        // Call the API with the given username and id
        deleteExpenseApi(username, id)
            .then(
                () => {
                    // Update the message to alert the targeted expense has been deleted
                    setMessage(`Delete of expense with ${id} successful`)
                    // Refresh the page after deletion
                    setRefreshPage(true)
                }
            )
    }

    // Define the logic to update expense details with given id
    function updateExpense(id) {
        navigate(`/expense/${id}`)
    }

    // Define the logic to create a new expense 
    function addNewExpense() {
        navigate(`/expense/-1`)
    }

    return (
        <div className="container">
            <h1 style={{ marginTop: '6%', fontSize: '35px' }}>Check Your Details</h1>
            {/* Rendering the message */}
            {message && <div className="alert alert-warning">{message}</div>}

            {/* Rendering the search bar  */}
            <Container className="d-flex justify-content-end" >
                <div className="search-bar-container">
                    <SearchBar onSearch={handleSearch} />
                </div>
            </Container>

            {/* Rendering the expense details of users */}
            <div>
                <table className="table" style={{ fontSize: '25px' }}>
                    <thead>
                        <tr>
                            <th>Type</th>
                            {/* Rendering a header of the table to display a dropdown menu to choose currencies */}
                            <th>
                                <DropdownButton id="dropdown-basic-button"
                                    title={`Choose a currency: ${selectedCurrency}`}>
                                    <Dropdown.Item onClick={() => handleCurrencyChange('USD')}>USD</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCurrencyChange('EUR')}>EUR</Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleCurrencyChange('CNY')}>CNY</Dropdown.Item>
                                </DropdownButton>
                            </th>
                            <th>Date</th>
                            <th>Delete</th>
                            <th>Update</th>
                        </tr>
                    </thead>
                    <tbody style={{ fontSize: '20px' }}>
                        {
                            details2.map(
                                detail =>
                                    // Rendering each row in the table has a unique key to match
                                    <tr key={detail.id}>
                                        <td>{detail.type}</td>
                                        <td> {currency === "EUR" ? "€" : currency === "USD" ? "$" : "¥"} {selectedCurrency ? (detail.convertedFee ? detail.convertedFee.toString() : 'N/A') : (detail.fee ? detail.fee.toString() : 'N/A')}</td>
                                        <td>{detail.date ? detail.date.toString() : 'N/A'}</td>
                                        <td><button className="btn btn-warning"
                                            onClick={() => deleteExpense(detail.id)}>Delete</button></td>
                                        <td><button className="btn btn-success"
                                            onClick={() => updateExpense(detail.id)}>Update</button>
                                        </td>
                                    </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
            {/* Rendering the button to add new expense */}
            <div className="btn btn-success m-5" onClick={addNewExpense}>Add New Expense</div>
        </div>
    )
}

export default ListExpenseComponent