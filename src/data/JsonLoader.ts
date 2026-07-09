import { GridConfig } from "../config/GridConfig";

export interface EmployeeData {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    salary: number;
}

export class JsonLoader {

    public loadData(): EmployeeData[] {

        const data: EmployeeData[] = [];

        const firstNames = [
            "Raj", "Amit", "Priya", "Neha", "Rohan",
            "Karan", "Ankit", "Sneha", "Rahul", "Pooja"
        ];

        const lastNames = [
            "Patel", "Shah", "Mehta", "Joshi", "Desai",
            "Trivedi", "Solanki", "Pandya", "Modi", "Dave"
        ];

        for (let i = 1; i <= GridConfig.JSON_RECORDS; i++) {

            data.push({
                id: i,
                firstName: firstNames[i % firstNames.length],
                lastName: lastNames[i % lastNames.length],
                age: 20 + (i % 30),
                salary: 25000 + (i * 500)
            });

        }

        return data;
    }

}