import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route('/users')
def get_user():
    username = request.args.get('username')
    
    # SECURE FIX: Using parameterized queries (placeholders) instead of f-string concatenation.
    # This ensures that user input is treated only as data, not executable SQL code.
    query = "SELECT * FROM users WHERE username = ?"
    
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor() 
    
    # Passing the username as a tuple to the execute function.
    # The sqlite3 driver handles escaping and sanitization automatically.
    try:
        cursor.execute(query, (username,))
        data = cursor.fetchall()
    except sqlite3.Error as e:
        # Handle database errors gracefully, logging the error internally if required.
        print(f"Database Error: {e}")
        return "An internal error occurred", 500
    finally:
        conn.close()

    return str(data)

if __name__ == '__main__':
    app.run(debug=True)