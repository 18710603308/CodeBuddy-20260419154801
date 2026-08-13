-- 重置示例数据集：先删除旧表（注意外键顺序），再重建
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS jobs;

-- 部门表
CREATE TABLE IF NOT EXISTS departments (
  dept_id     INT PRIMARY KEY,
  dept_name   VARCHAR(50) NOT NULL,
  location    VARCHAR(100)
);

-- 职位表
CREATE TABLE IF NOT EXISTS jobs (
  job_id      INT PRIMARY KEY,
  job_title   VARCHAR(50) NOT NULL,
  min_salary  NUMERIC(10,2),
  max_salary  NUMERIC(10,2)
);

-- 员工表
CREATE TABLE IF NOT EXISTS employees (
  emp_id      INT PRIMARY KEY,
  emp_name    VARCHAR(50) NOT NULL,
  gender      CHAR(1) CHECK (gender IN ('M','F')),
  hire_date   DATE,
  salary      NUMERIC(10,2),
  dept_id     INT,
  job_id      INT,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
  FOREIGN KEY (job_id)  REFERENCES jobs(job_id)
);

INSERT INTO departments (dept_id, dept_name, location) VALUES
  (1, '研发部', '深圳'),
  (2, '产品部', '北京'),
  (3, '市场部', '上海'),
  (4, '销售部', '广州'),
  (5, '财务部', '深圳'),
  (6, '人力资源部', '北京');

INSERT INTO jobs (job_id, job_title, min_salary, max_salary) VALUES
  (1, '初级工程师', 8000, 15000),
  (2, '高级工程师', 15000, 30000),
  (3, '产品经理',   18000, 35000),
  (4, '市场专员',   6000, 12000),
  (5, '销售代表',   5000, 15000),
  (6, '财务专员',   7000, 15000),
  (7, 'HR专员',     6000, 12000);

INSERT INTO employees (emp_id, emp_name, gender, hire_date, salary, dept_id, job_id) VALUES
  (1,  '张伟', 'M', '2020-03-15', 22000, 1, 2),
  (2,  '李娜', 'F', '2021-06-01', 18000, 2, 3),
  (3,  '王强', 'M', '2019-11-20', 28000, 1, 2),
  (4,  '刘洋', 'F', '2022-02-14', 12000, 3, 4),
  (5,  '陈静', 'F', '2020-09-01', 15000, 4, 5),
  (6,  '杨帆', 'M', '2018-07-10', 32000, 1, 2),
  (7,  '赵磊', 'M', '2023-01-05', 10000, 2, 1),
  (8,  '孙丽', 'F', '2021-12-01', 9500, 3, 4),
  (9,  '周杰', 'M', '2019-04-22', 25000, 1, 2),
  (10, '吴敏', 'F', '2022-08-15', 13000, 5, 6),
  (11, '郑浩', 'M', '2020-10-01', 11000, 4, 5),
  (12, '王芳', 'F', '2023-05-20', 8500, 6, 7),
  (13, '冯军', 'M', '2021-03-08', 16000, 2, 3),
  (14, '蒋婷', 'F', '2022-11-30', 10500, 5, 6),
  (15, '沈鹏', 'M', '2020-06-18', 20000, 1, 2);
