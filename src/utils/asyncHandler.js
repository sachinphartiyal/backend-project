/*
A higher order function is a function that takes one or more functions as arguments, or returns a function as its result.
Here asyncHandler is a higher order function.

What is asyncHandler?
When writing async functions in Express routes (e.g., for database operations), if an error occurs (like DB is down or invalid input), 
the server might crash or not handle the error properly unless you catch it.

Problem:
JavaScript async/await doesn't automatically catch and forward errors to Express's error handler.

Purpose of asyncHandler
It’s a higher-order function (a function that returns another function) used to wrap async route handlers 
and automatically forward any errors to Express's next() function (which triggers error-handling middleware).


*/

/*
const asyncHandler = (func) => { () => {} }

async (req, res, next) => { try { await getUser(...) } catch {} }
This is a wrapper function — it's not just getUser. It’s a new function that adds error handling around getUser.
*/

const asyncHandler=(requestHandler)=>{
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next))
        .catch((err)=>next(err))
    }
}

export {asyncHandler}



/*
This defines a function named asyncHandler that takes another function fn as an argument.
async (req, res, next) => {...} --> This is the function returned from asyncHandler. It's the actual function Express will call for each request.

*/
/*
const asyncHandler=(fn)=>async(req, res, next)=>{
    try{
        await fn(req, res, next)
    } catch(error){
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
}
*/
