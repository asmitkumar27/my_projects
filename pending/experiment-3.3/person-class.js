// Base class
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    displayInfo() {
        return `Name: ${this.name}, Age: ${this.age}`;
    }
}
class Student extends Person {
    constructor(name, age, course) {
        super(name, age);
        this.course = course;
    }

    // Override method
    displayInfo() {
        return `${super.displayInfo()}, Course: ${this.course}`;
    }
}

// Subclass: Teacher
class Teacher extends Person {
    constructor(name, age, subject) {
        super(name, age);
        this.subject = subject;
    }

    // Override method
    displayInfo() {
        return `${super.displayInfo()}, Subject: ${this.subject}`;
    }
}
// Example usage
const student1 = new Student("Alice", 20, "Computer Science");
const teacher1 = new Teacher("Mr. John", 45, "Mathematics");

console.log(student1.displayInfo());
// Output: Name: Alice, Age: 20, Course: Computer Science

console.log(teacher1.displayInfo());
// Output: Name: Mr. John, Age: 45, Subject: Mathematics