// Initialize date input to today’s date
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    calculateTotal(); // Ensure total is calculated on load
});
// calculate total for bill
function calculateTotal() {
    let subtotal = 0;
    const rows = document.querySelectorAll('#billing-table tbody tr');

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.quantity').value) || 0;
        const price = parseFloat(row.querySelector('.price').value) || 0;
        const total = qty * price;
        row.querySelector('.row-total').textContent = total.toFixed(2);
        subtotal += total;
    });

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);

    let discount = parseFloat(document.getElementById('discount').value) || 0;
    discount = (subtotal * discount) / 100;
    document.getElementById('discount-amount').textContent = discount.toFixed(2);

    const gstCheckbox = document.getElementById('gst');
    let gstAmount = 0;
    if (gstCheckbox.checked) {
        const gstRate = document.querySelector('input[name="gst-rate"]:checked');
        if (gstRate) {
            gstAmount = (subtotal - discount) * (parseFloat(gstRate.value) / 100);
        }
    }

    document.getElementById('gst-amount').textContent = gstAmount.toFixed(2);
    const totalAmount = subtotal - discount + gstAmount;
    document.getElementById('total-amount').textContent = totalAmount.toFixed(2);
}

// Add a new row to the table
function addRow() {
    const tableBody = document.querySelector('#billing-table tbody');
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td>${tableBody.rows.length + 1}</td>
        <td><textarea class="description" rows="1"></textarea></td>
        <td><input type="number" class="quantity" oninput="calculateTotal()"></td>
        <td><input type="number" class="price" oninput="calculateTotal()"></td>
        <td class="row-total">0.00</td>
        <td><button type="button" onclick="deleteRow(this)">❌</button></td>
    `;

    tableBody.appendChild(newRow);
}

// Delete a row from the table
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
    calculateTotal();
}

function toggleGST() {
    const gstPercentage = document.getElementById('gst-percentage');
    if (document.getElementById('gst').checked) {
        gstPercentage.style.display = 'block';
    } else {
        gstPercentage.style.display = 'none';
    }
    calculateTotal();
}

function printBill() {
    window.print();
}

function resetForm() {
    document.getElementById('billing-form').reset();
    document.getElementById('gst-percentage').style.display = 'none';
    const tableBody = document.querySelector('#billing-table tbody');
    while (tableBody.rows.length > 1) {
        tableBody.deleteRow(1);
    }
    calculateTotal();
}

function sendBill() {
    // Gather form data
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const date = document.getElementById('date').value;
    const receiptNo = document.getElementById('receipt-no').value;
    const recipientEmail = document.getElementById('recipient-email').value.trim();
    const adminPassword = document.getElementById('admin-password').value.trim();

    if (!name || !address || !recipientEmail || !date || !receiptNo || !adminPassword) {
        alert("Please fill in all required fields before sending the bill.");
        return;
    }

    const subtotal = document.getElementById('subtotal').textContent;
    const discount = document.getElementById('discount').value || 0;
    const discountAmount = document.getElementById('discount-amount').textContent;
    const gstAmount = document.getElementById('gst-amount').textContent;
    const totalAmount = document.getElementById('total-amount').textContent;

    // Gather table data (billing items)
    const items = [];
    const rows = document.querySelectorAll('#billing-table tbody tr');
    rows.forEach(row => {
        const description = row.querySelector('.description').value.trim();
        const quantity = row.querySelector('.quantity').value || 0;
        const price = row.querySelector('.price').value || 0;
        const total = row.querySelector('.row-total').textContent;

        items.push({ description, quantity, price, total });
    });

    // Prepare data to send to the server
    const billData = {
        name,
        address,
        date,
        receiptNo,
        recipientEmail,
        subtotal,
        discount,
        discountAmount,
        gstAmount,
        totalAmount,
        items,
        adminPassword
    };

    // Send bill data to the backend (Node.js server)
    fetch('/send-bill', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Bill sent successfully with PDF!');
        } else {
            alert('Error sending the bill: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error sending the bill.');
    });
}

