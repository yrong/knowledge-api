/**
 *
 * @param asyncFn
 */
exports.asyncRequest = (asyncFn) => {
    return (req, res, next) => {
        const routePromise = asyncFn(req, res, next);
        if (routePromise.catch) {
            routePromise.catch(err => next(err));
        }
    }
}