import { useEffect, useState } from 'react'
import { retrieveExpenseApi, updateExpenseApi, createExpenseApi } from './api/ExpenseApiService'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from "./security/AuthContext"
import { Formik, Form, Field, ErrorMessage } from 'formik'

// Define the logic of the expense component
export default function ExpenseComponent() {

    // Fetch the value from the parameter of the router
    const { id } = useParams()

    // Put the status of the type, fee, and date in the current context
    const [type, setType] = useState('')
    const [fee, setFee] = useState('')
    const [date, setDate] = useState('')

    // Use a hook to retrieve the authentication context
    const authContext = useAuth()

    // Initialize the useNavigate hook
    const navigate = useNavigate()

    // Create a variable from the current context
    const username = authContext.username

    // Define the rendering of retrieving expense
    useEffect(() => {
        function retrieveExpense() {
            // Set the condition that if the id exists and execute codes following
            if (id !== -1) {
                // Call the retrieve expense API with the username and the id
                retrieveExpenseApi(username, id)
                    // Fetch the value of the type, fee, and data from the response if the request is succussful
                    .then(response => {
                        setType(response.data.type);
                        setFee(response.data.fee);
                        setDate(response.data.date);
                        console.log(response);
                    })
                    // Handle the error event and log on the console
                    .catch(error =>
                        console.log(error));
            }
        }

        // Call the retrieve expense function
        retrieveExpense();

    }, [id, username]);

    // Define the submit operation
    function onSubmit(values) {
        console.log(values)
        const expense = {
            id: id,
            username: username,
            type: values.type,
            fee: values.fee,
            date: values.date
        }
        console.log(expense)

        // Call the API to create a new expense when the id in the router is "-1"
        if (id === -1) {
            createExpenseApi(username, expense)
                .then(response => {
                    navigate('/details')
                })
                .catch(error => console.log(error))
        } else {
            // Call the API to modify the expense when the id in the router has valid value
            updateExpenseApi(username, id, expense)
                .then(response => {
                    navigate('/details')
                })
                .catch(error => console.log(error))
        }
    }

    // Define the validation of the form 
    function validate(values) {
        // Initialize a empty object to store the value of errors
        let errors = {}
        // Validation for the length of the type value
        if (values.type.length < 2) {
            errors.type = 'Enter atleast 5 characters'
        }
        // Validation for the value of the fee amount
        if (values.fee < 0) {
            errors.fee = 'Enter a valid fee amount'
        }

        return errors
    }



    return (
        <div className="container">
            <h1 style={{ fontSize: '40px', marginTop: '35px' }}>Enter Expense Details</h1>
            {/* Rendering the form using the formik */}
            <div>
                {/* Initialization of the form */}
                <Formik initialValues={{ type, fee, date, convertedAmount: '' }}
                    enableReinitialize={true}
                    onSubmit={onSubmit}
                    validate={validate}
                    validateOnChange={false}
                    validateOnBlur={false}
                >
                    {
                        (props) => (
                            // Input validation
                            <Form>
                                {/* Error message */}
                                <ErrorMessage
                                    name='type'
                                    component='div'
                                    className='alert alert-warning'
                                />
                                {/* Error message */}
                                <ErrorMessage
                                    name='fee'
                                    component='div'
                                    className='alert alert-warning'
                                />
                                {/* Error message */}
                                <ErrorMessage
                                    name='date'
                                    component='div'
                                    className='alert alert-warning'
                                />
                                {/* Input for the type */}
                                <fieldset className='form-group'>
                                    <label>Type</label>
                                    <div className='col-md-5 mx-auto'>
                                        <Field type='text' className='form-control' name='type' />
                                    </div>

                                </fieldset>
                                {/* Input for payment amount */}
                                <fieldset className='form-group'>
                                    <label >Payment Amount</label>
                                    <div className='col-md-5 mx-auto'>
                                        <Field type='text' className='form-control' name='fee' />
                                    </div>
                                </fieldset>
                                {/* Input for the date */}
                                <fieldset className='form-group'>
                                    <label >Payment Date</label>
                                    <div className='col-md-5 mx-auto'>
                                        <Field type='date' className='form-control' name='date' />
                                    </div>

                                </fieldset>
                                {/* Rendering the button to submit */}
                                <div>
                                    <button className='btn btn-success m-5' type='submit'>Save</button>
                                </div>
                            </Form>
                        )
                    }
                </Formik>
            </div>
        </div>
    )
} 