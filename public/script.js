// Initialize date input to today’s date
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    toggleGST(); // Ensure GST toggle state is correct
    calculateTotal(); // Ensure total is calculated on load
});

// Calculate total for bill
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
    if (discount > 100) discount = 100; // Prevent invalid discount
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

// Toggle GST percentage selection
function toggleGST() {
    const gstPercentage = document.getElementById('gst-percentage');
    gstPercentage.style.display = document.getElementById('gst').checked ? 'block' : 'none';
    calculateTotal();
}
function getSelectedGSTPercentage() {
    const selectedGSTRadio = document.querySelector('input[name="gst-rate"]:checked');
    return selectedGSTRadio ? selectedGSTRadio.value : 0;
  }

// Reset the billing form
function resetForm() {
    document.getElementById('billing-form').reset();
    document.getElementById('gst-percentage').style.display = 'none';

    const tableBody = document.querySelector('#billing-table tbody');
    tableBody.innerHTML = ''; // Clear all rows
    calculateTotal();
}

// Get bill data from form
function getBillData() {
    return {
        name: document.getElementById('name').value.trim(),
        address: document.getElementById('address').value.trim(),
        date: document.getElementById('date').value,
        receiptNo: document.getElementById('receipt-no').value,
        recipientEmail: document.getElementById('recipient-email').value.trim(),
        subtotal: document.getElementById('subtotal').textContent,
        discount: document.getElementById('discount').value || 0,
        gstPercentage: getSelectedGSTPercentage(),
        discountAmount: document.getElementById('discount-amount').textContent,
        gstAmount: document.getElementById('gst-amount').textContent,
        totalAmount: document.getElementById('total-amount').textContent,
        items: Array.from(document.querySelectorAll('#billing-table tbody tr')).map(row => ({
            description: row.querySelector('.description').value.trim(),
            quantity: row.querySelector('.quantity').value || 0,
            price: row.querySelector('.price').value || 0,
            total: row.querySelector('.row-total').textContent,
        })),
        adminPassword: document.getElementById('admin-password').value.trim()
    };
}

// Send bill data to the backend
function sendBill() {
    const billData = getBillData();

    if (!billData.name || !billData.address || !billData.recipientEmail || !billData.date || !billData.receiptNo || !billData.adminPassword) {
        alert("Please fill in all required fields before sending the bill.");
        return;
    }

    fetch('/send-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

// Handle PDF download when the button is clicked
document.getElementById('download-pdf-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent any default action on button click

    try {
        // Get bill data directly using getBillData()
        const billData = getBillData();

        const response = await fetch('/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billData),
        });

        if (!response.ok) throw new Error('Failed to generate PDF');

        const blob = await response.blob();

        // Create an invisible <a> tag to trigger the download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `InvoiceNO:XYZ/${billData.receiptNo}/25-26.pdf`; // Filename for the downloaded PDF
        document.body.appendChild(link); // Add the link to the DOM

        // Trigger the download
        link.click();

        // Clean up by removing the link element from the DOM
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to download PDF. Please try again.');
    }
});
