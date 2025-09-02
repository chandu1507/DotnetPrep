Good one 👍 This is asked a lot in interviews. Let’s break it down clearly:

---

## 🔹 Stored Procedure (SP)

A **Stored Procedure** is a **precompiled block of SQL code** stored in the database.

* It can take parameters.
* It runs on the server side.
* Execution plan is cached (faster on repeated calls).

👉 Example:

```sql
CREATE PROCEDURE GetCustomerOrders
    @CustomerID INT
AS
BEGIN
    SELECT OrderID, Product
    FROM Orders
    WHERE CustomerID = @CustomerID;
END;
```

**Usage:**

```sql
EXEC GetCustomerOrders @CustomerID = 1;
```

✅ Benefits:

* Performance (execution plan reused).
* Secure (can restrict direct table access).
* Easy to maintain.
* Supports business logic in one place.

---

## 🔹 Dynamic SQL Query

A **Dynamic Query** is SQL built **at runtime** as a string, often inside an SP or application code.

* Useful when you don’t know in advance what the exact query looks like.
* Flexible (can build queries based on conditions).
* Requires `EXEC()` or `sp_executesql` to run.

👉 Example inside SQL Server:

```sql
DECLARE @sql NVARCHAR(MAX);
SET @sql = 'SELECT OrderID, Product FROM Orders WHERE CustomerID = ' + CAST(1 AS NVARCHAR);
EXEC(@sql);
```

✅ Benefits:

* Very flexible (can include dynamic table names, columns, filters).
* Good for search filters (where user may choose multiple optional conditions).

❌ Risks:

* Slower (no cached plan unless using `sp_executesql`).
* Prone to **SQL Injection** if not handled properly.
* Harder to debug and maintain.

---

## 🔑 Difference Summary

| Feature             | Stored Procedure (SP)          | Dynamic Query                  |
| ------------------- | ------------------------------ | ------------------------------ |
| **Definition**      | Precompiled SQL block          | SQL built at runtime           |
| **Performance**     | Faster (cached plan)           | Slower (unless optimized)      |
| **Security**        | Safer (permissions, params)    | Risky (SQL injection possible) |
| **Flexibility**     | Fixed structure                | Highly flexible                |
| **Maintainability** | Centralized, easy to maintain  | Harder to read/debug           |
| **Use Case**        | Repeated logic, business rules | Ad-hoc filters, dynamic search |

---

👉 Easy Analogy:

* **SP** = Like a **restaurant menu item** (recipe is fixed, ready, optimized).
* **Dynamic Query** = Like a **chef making a custom dish** for each order (flexible, but slower and more prone to mistakes).

---

Do you want me to also show a **real-world scenario** where SP + dynamic query are combined (like dynamic search filters inside an SP)? That’s a common interview coding question.

---

Great question 👍 Interviewers love this because it tests both your SQL depth and your practical thinking.

Let’s assume a table **Employees** with duplicate rows:

**Employees**

| EmpID | Name    | Dept |
| ----- | ------- | ---- |
| 1     | Alice   | HR   |
| 2     | Bob     | IT   |
| 2     | Bob     | IT   |
| 3     | Charlie | IT   |
| 3     | Charlie | IT   |

---

## ✅ 1. Using **ROW\_NUMBER()** (Most common & preferred)

Add a row number partitioned by the duplicate columns, then delete where row > 1.

```sql
WITH CTE AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY EmpID, Name, Dept ORDER BY EmpID) AS rn
    FROM Employees
)
DELETE FROM CTE WHERE rn > 1;
```

👉 Keeps the first row, deletes duplicates.

---

## ✅ 2. Using **RANK() / DENSE\_RANK()**

Similar to ROW\_NUMBER but less common.

```sql
WITH CTE AS (
    SELECT *,
           RANK() OVER (PARTITION BY EmpID, Name, Dept ORDER BY EmpID) AS rnk
    FROM Employees
)
DELETE FROM CTE WHERE rnk > 1;
```

---

## ✅ 3. Using **GROUP BY + MIN/MAX**

Keep one record (say MIN EmpID) and delete others.

```sql
DELETE FROM Employees
WHERE EmpID NOT IN (
    SELECT MIN(EmpID)
    FROM Employees
    GROUP BY Name, Dept
);
```

👉 Risk: fails if NULLs or if you want to keep *exact* duplicates.

---

## ✅ 4. Using **Self-Join**

Delete where a duplicate with a smaller ID exists.

```sql
DELETE e1
FROM Employees e1
JOIN Employees e2
  ON e1.Name = e2.Name
 AND e1.Dept = e2.Dept
 AND e1.EmpID > e2.EmpID;
```

👉 Deletes the “later” duplicates.

---

## ✅ 5. Using **CTE with DISTINCT into new table**

Another approach:

```sql
SELECT DISTINCT EmpID, Name, Dept
INTO Employees_New
FROM Employees;

-- drop old table and rename new
DROP TABLE Employees;
EXEC sp_rename 'Employees_New', 'Employees';
```

👉 Simple, but involves table recreation.

---

## ✅ 6. Using **Temporary Table**

Insert only distinct records into a temp table, then truncate and reload.

```sql
SELECT DISTINCT * INTO #TempEmployees FROM Employees;

TRUNCATE TABLE Employees;

INSERT INTO Employees SELECT * FROM #TempEmployees;
```

---

## 🔑 Summary Table

| Method                 | Pros                         | Cons                             |
| ---------------------- | ---------------------------- | -------------------------------- |
| `ROW_NUMBER()`         | Precise, flexible, most used | Needs CTE / subquery             |
| `GROUP BY + MIN/MAX`   | Easy, quick for simple keys  | May fail if NULLs/complex cols   |
| `Self-Join`            | Clear logic, keeps lowest ID | Slow on big tables               |
| `DISTINCT → New Table` | Very simple, works always    | Rebuilds table (heavy operation) |
| Temp Table             | Easy for small sets          | Not efficient for large tables   |

---

👉 Interview Tip:
If asked, start with **ROW\_NUMBER()** (best practice), then mention alternatives depending on scenario (performance, table size, need to preserve constraints).

---

Do you want me to also show a **performance comparison** (which one is best for large tables with millions of rows)?

---

Excellent question 👍 People often confuse **ROW\_NUMBER()** and **RANK()** (and also **DENSE\_RANK()**). Let’s carefully break it down with **examples**.

---

## 🔹 **ROW\_NUMBER()**

* Assigns a **unique sequential number** to each row within a partition.
* Even if values are tied (duplicates), numbers do **not repeat**.
* Always increments by 1.

👉 Example:

```sql
SELECT Name, Dept,
       ROW_NUMBER() OVER (PARTITION BY Dept ORDER BY Name) AS RowNum
FROM Employees;
```

**Result (Partition by Dept = IT):**

| Name    | Dept | RowNum |
| ------- | ---- | ------ |
| Bob     | IT   | 1      |
| Charlie | IT   | 2      |
| Charlie | IT   | 3      |

✅ Notice: Charlie appears twice → ROW\_NUMBER keeps numbering sequential (2,3).

---

## 🔹 **RANK()**

* Assigns the **same rank** to equal values (ties).
* **Skips the next number(s)** after a tie (gaps appear).

👉 Example:

```sql
SELECT Name, Dept,
       RANK() OVER (PARTITION BY Dept ORDER BY Name) AS Rnk
FROM Employees;
```

**Result (Partition by Dept = IT):**

| Name    | Dept | Rnk |
| ------- | ---- | --- |
| Bob     | IT   | 1   |
| Charlie | IT   | 2   |
| Charlie | IT   | 2   |

✅ Tie: Both Charlies get `2`, but the next rank would be `4` (skips `3`).

---

## 🔹 **DENSE\_RANK()** (bonus)

* Same as RANK(), but **no gaps** after ties.

👉 Example:

```sql
SELECT Name, Dept,
       DENSE_RANK() OVER (PARTITION BY Dept ORDER BY Name) AS DRnk
FROM Employees;
```

**Result (Partition by Dept = IT):**

| Name    | Dept | DRnk |
| ------- | ---- | ---- |
| Bob     | IT   | 1    |
| Charlie | IT   | 2    |
| Charlie | IT   | 2    |

✅ Tie: Both Charlies get `2`, but the next rank will be `3` (no skip).

---

## 🔑 Difference Summary

| Function        | Ties | Numbers Skipped? | Example Output |
| --------------- | ---- | ---------------- | -------------- |
| **ROW\_NUMBER** | ❌    | Never            | 1,2,3          |
| **RANK**        | ✅    | Yes (gaps)       | 1,2,2,4        |
| **DENSE\_RANK** | ✅    | No (continuous)  | 1,2,2,3        |

---

👉 Easy Analogy:

* **ROW\_NUMBER()** → Giving students roll numbers in class (always unique).
* **RANK()** → Giving prizes in a race (if 2 people tie at 2nd place, next is 4th).
* **DENSE\_RANK()** → Giving prizes but no skipping (if 2 tie at 2nd, next is 3rd).

---

Do you want me to also show **when to use which one** in real-world SQL problems (like deleting duplicates, top-N per category, leaderboard ranking)?
