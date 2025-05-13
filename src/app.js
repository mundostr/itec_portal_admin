import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import multer from 'multer';

const PORT = process.env.PORT || 3000;

dotenv.config();

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const upload = multer();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(session({ secret: process.env.SUPABASE_SERVICE_ROLE_KEY, resave: false, saveUninitialized: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.status(200).send({ error: null, message: 'ITEC Rafaela Portal' });
});

app.get('/register', (req, res) => {
    res.redirect('/register.html');
});

app.get('/login', (req, res) => {
    res.redirect('/login.html');
});

app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) console.error('Session destruction error:', err);
            res.clearCookie('connect.sid');
            res.clearCookie('sb-access-token');
            res.clearCookie('sb-refresh-token');
            res.redirect('/login.html');
        });
    }
});

app.get('/admin', (req, res) => {
    if (!req.session.user) return res.redirect('/login.html');
    res.redirect('/admin.html');
});

/* app.get('/news', async (req, res) => {
    const { data, error } = await supabase.from('news').select('*');

    if (error) {
        console.error(error);
        return res.status(500).send('Error fetching news');
    }

    res.json(data);
}); */

/* app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('users').insert([{ username, password: hashedPassword }]);

    if (error) {
        console.error(error);
        return res.redirect('/register.html');
    }

    res.redirect('/login.html');
}); */

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const { data: users, error } = await supabase.from('users').select('*').eq('username', username);

    if (error || users.length === 0) {
        console.error(error);
        return res.redirect('/login');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
        req.session.user = user;
        res.redirect('/admin.html');
    } else {
        res.redirect('/login.html');
    }
});

app.post('/addnews', upload.none(), async (req, res) => {
    if (!req.session.user) return res.redirect('/login.html');
    
    const { title, detail, image } = req.body;

    const { data, error } = await supabase.from('news').insert([{ title, detail, image }]);

    if (error) {
        console.error(error);
        return res.redirect('/admin.html');
    }

    res.redirect('/admin.html');
});


// MAIN
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
