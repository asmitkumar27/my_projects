const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let employees = [
    { name: 'Ram', id: '1' },
    { name: 'arun', id: '2' },
    { name: 'asmit', id: '3' }
];


function showMenu() {
    console.log('\nEmployee Management System');
    console.log('1. Add Employee');
    console.log('2. List Employees');
    console.log('3. Remove Employee');
    console.log('4. Exit');

    rl.question('Enter your choice: ', (choice) => {
        switch (choice) {
            case '1':
                addEmployee();
                break;
            case '2':
                listEmployees();
                break;
            case '3':
                removeEmployee();
                break;
            case '4':

                rl.close();
                break;
            default:
                console.log('Invalid choice. Please try again.');
                showMenu();
                break;
        }
    });
}


function addEmployee() {
    rl.question('Enter employee name: ', (name) => {
        rl.question('Enter employee ID: ', (id) => {

            employees.push({ name, id });
            console.log(`Employee ${name} (ID: ${id}) added successfully.`);
            showMenu();
        });
    });
}


function listEmployees() {
    console.log('\nEmployee List:');
    if (employees.length === 0) {
        console.log('No employees found.');
    } else {

        employees.forEach((employee, index) => {
            console.log(`${index + 1}. Name: ${employee.name}, ID: ${employee.id}`);
        });
    }
    showMenu();
}


function removeEmployee() {
    rl.question('Enter the ID of the employee to remove: ', (idToRemove) => {
        const index = employees.findIndex(employee => employee.id === idToRemove);

        if (index !== -1) {
            const removedEmployee = employees.splice(index, 1);
            console.log(`Employee ${removedEmployee[0].name} (ID: ${idToRemove}) removed successfully.`);
        } else {
            console.log(`Employee with ID ${idToRemove} not found.`);
        }
        showMenu();
    });
}

rl.on('close', () => {
    console.log('Exiting Employee Management System. Goodbye!');
    process.exit(0);
});


showMenu();
