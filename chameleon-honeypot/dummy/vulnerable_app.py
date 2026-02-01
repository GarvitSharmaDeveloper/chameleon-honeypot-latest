import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route('/users')
def get_user():
    # Retrieve user input, which must be treated as untrusted data.
    username = request.args.get('username')
    
    # ==================================================================
    # SECURITY FIX: Implementing Parameterized Queries (Prepared Statements)
    # This is the industry standard for preventing SQL Injection (SQLi).
    # The previous code likely used vulnerable f-strings or string concatenation.
    # ==================================================================
    
    # 1. Use a '?' placeholder in the SQL string where variable data belongs.
    query = "SELECT * FROM users WHERE username = ?"
    
    # Ensure the connection is managed safely.
    conn = None
    try:
        # CRITICAL: Connect to the database.
        # In a production environment, connection pooling should be used.
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor() 
        
        # 2. Execute the query by passing the user input separately as a tuple (username,).
        # The sqlite3 driver handles escaping and sanitization of the input 'username'
        # automatically. This ensures that the malicious payload ("ADMIN' OR '1'='1' --")
        # is treated purely as a literal string value to be matched in the database,
        # preventing the logic bypass.
        cursor.execute(query, (username,))
        data = cursor.fetchall()
    
    except sqlite3.Error as e:
        # Handle database errors gracefully, logging the error internally and
        # avoiding revealing database details to the user.
        print(f"Database Error: {e}")
        return "An internal server error occurred while retrieving data.", 500
    
    finally:
        # Always close the connection, even if an exception occurred.
        if conn:
            conn.close()

    # Note: If 'data' contained HTML/script content, proper output encoding (e.g., Jinja2 autoescaping)
    # would be required to prevent Cross-Site Scripting (XSS).
    return str(data)

if __name__ == '__main__':
    # For production environments, ensure debug=False and use a WSGI server (Gunicorn, uWSGI).
    app.run(debug=True)