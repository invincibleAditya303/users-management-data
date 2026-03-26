const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.json())

const path = require('path')
const dbPath = path.join(__dirname, 'usersDetails.db')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const PORT = process.env.PORT || 3000

let db = null

const intializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })

        app.listen(PORT, () => {
            console.log('Server running at http://localhost:3000')
        })
    } catch (e) {
        console.log(`DB Rrror: ${e}`)
    }
}

intializeDbAndServer()

// Add User API
app.post('/users', async (request, response) => {
    const {name, email, phone, company, role} = request.body

    if (!name || !phone || !email || !company) {
        return response.status(400).json({error: 'No null values'})
    }

    const getUserQuery = `
        SELECT 
            *
        FROM
            users
        WHERE
            email = '${email}' or 
            phone = '${phone}';
    `

    const isEmailAndPhoneNUmberPresent = await db.get(getUserQuery)

    if (isEmailAndPhoneNUmberPresent === undefined) {
        if (name!=='' && email!=='' && phone!=='' && company!=='') {
            const addQuery = `
                INSERT INTO users 
                (name, email, phone, company, role)

                VALUES 
                (?, ?, ?, ?, ?);
            `

            try {
                await db.run(addQuery, [name, email, phone, company, role])
                response.status(200).json({message: 'User added successfully'})
            } catch (e) {
                response.status(400).json({error: `${e}`})
            }
        } else {
            response.status(400).json({message: 'User already exists'})
        }
    }
})

//Get Users API
app.get('/users', async (request, response) => {
    let {search, order, sort} = request.query

    search = search || ''
    sort = sort || 'id'
    order = 'ASC' || order.toUpperCase()

    let getUsersQuery

    if (!search) {
        getUsersQuery = `
            SELECT
                *
            FROM
                users
        `
    } else {
        getUsersQuery = `
            SELECT
                *
            FROM
                users
            WHERE
                name LIKE '%${search}%'
        `
    }

    getUsersQuery += ` ORDER BY ${sort} ${order};`

    const allUsers = await db.get(getUsersQuery)

    response.status(200).json({message: allUsers})
})

//Get User API
app.get('/users/:id', async (request, response) => {
    const {id} = request.params

    const getUserQuery = `
        SELECT
            *
        FROM
            users
        WHERE
            id = ${id};
    `

    const user = await db.get(getUserQuery)

    response.status(200).json({message: user})
})

//Update User API
app.put('/users/:id', async (request, response) => {
    const {id} = request.params

    const getUserQuery = `
        SELECT 
            *
        FROM
            users
        WHERE
            id = ${id};
    `
    const user = await db.get(getUserQuery)

    if (user !== undefined) {
        const {name=user.name, email=user.email, phone=user.phone, company=user.company, role=user.role} = request.body

        const updateExistingUser = `
            UPDATE
                users
            SET
                name = '${name}',
                email = '${email}',
                phone = '${phone}',
                company = '${company}',
                role = '${role}'
            WHERE
                id = ${id};
        `

        try {
            await db.run(updateExistingUser)
            response.status(200).json({message: 'User updated successfully'})
        } catch (e) {
            response.status(400).json({error: `${e.message}`})
        }
    } else {
        response.status(400).json({error: 'User not found'})
    }
})

//Delete User API
app.delete('/users/:id', async (request, response) => {
    const {id} = request.params

    const deleteUserQuery = `
        DELETE FROM
            users
        WHERE
            id = ${id};
    `

    try {
        await db.get(deleteUserQuery)
        response.status(200).json({message: 'User deleted successfully'})
    } catch (e) {
        response.status(400).json({error: `${e.message}`})
    }
})