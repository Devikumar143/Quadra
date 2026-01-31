try {
    const r = require('./src/routes/seasonRoutes');
    console.log('Require success!');
} catch (err) {
    console.error('Require failed:', err);
}
