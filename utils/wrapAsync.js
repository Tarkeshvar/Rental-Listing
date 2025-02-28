module.exports =(fn)=> {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next); // ✅ Ensures errors go to Express error handler
};
};