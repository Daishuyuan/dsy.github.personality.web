---
title: 算法探究(Javascript)之大杂烩(1)
date: 2018-03-01 09:33:09
toc: true
tags:
    - 算法
    - Javascript
---
![分形][1]
*&emsp;&emsp;**Ever tried. Ever failed.**
&emsp;&emsp;**No matter. Try again.**
&emsp;&emsp;**Fail again. Fail better.**
&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; **--Peter Dinklage***

# **斐波那契数列与动态规划（算法在性能上的提高）** #
> &emsp;&emsp;斐波那契数列（Fibonacci sequence），又称黄金分割数列、因数学家列昂纳多·斐波那契（Leonardoda Fibonacci）以兔子繁殖为例子而引入，故又称为“兔子数列”，指的是这样一个数列：1、1、2、3、5、8、13、21、34、……在数学上，斐波纳契数列以如下被以递归的方法定义：F(0)=0，F(1)=1, F(n)=F(n-1)+F(n-2)（n>=2，n∈N*）在现代物理、准晶体结构、化学等领域，斐波纳契数列都有直接的应用，为此，美国数学会从1963年起出版了以《斐波纳契数列季刊》为名的一份数学杂志，用于专门刊载这方面的研究成果。

<!-- more -->

&emsp;&emsp;*斐波那契数列* 相信大家都很熟悉，数列的形式也非常简单即：1,1,2,3,5,8,...在计算机上实现斐波那契数列的计算是个不算难的问题，教科书上的代码非常优雅漂亮，类似代码如下：
```javascript
function fibonacci_no(num) {
    if (num == 1 || num == 2) {
        return 1;
    } else if (num <= 0) {
        return NaN;
    }
    return fibonacci_no(num - 2) + fibonacci_no(num - 1);
}
```
&emsp;&emsp;可以看到，采用递归调用的方式（如果大家不清楚递归调用，就请翻翻数据结构相关的书籍）可以很简便地计算出来。但是，这个函数的效率是十分低下的，甚至有些情况下根本不能忍受。在计算F(30)以下的数值，它的速度勉强可以接受，当数量级增加到F(50)以上时，就会感觉运算明显卡顿，这样的函数是不足以作为一个合格的基础函数使用的。
&emsp;&emsp;那么，有什么办法可以解决这个效率问题呢？我们可以考虑动态规划的办法。提到动态规划，不得不提子结构，如果解决一个问题可以通过解决这个问题的一系列重复子问题，那么这个问题就具备子结构的性质。如果解决这些子问题得到的最优解恰好能得到这个问题的最优解，那么这个问题具备最优子结构的性质（Optimal Substructure）。当然，斐波那契数列具有非常好的子结构的特点，她的每一个解都依赖于她子问题的解。那么，我们来看看，动态规划下的代码是怎样的？
```javascript
function fibonacci_dp(num) {
    if (num > 0) {
        let memory = [NaN,1,1], stack = [num];
        while(stack.length > 0) {
            let calNum = stack.pop();
            if (!memory[calNum]) {
                let num2 = memory[calNum - 2];
                let num1 = memory[calNum - 1];
                if (num1 && num2) {
                    memory[calNum] = num1 + num2;
                } else {
                    stack.push(calNum);
                    if (!num2) {
                        stack.push(calNum - 2);
                    }
                    if (!num1) {
                        stack.push(calNum - 1);
                    }
                }
            }
        }
        return memory[num];
    }
    return NaN;
}
```
&emsp;&emsp;我们在函数中加入了一个数组和一个栈，数组用来记录我们解决过的子问题的结果，而栈用来消除递归。数组初始化时只放入我们已经知道的解，比如F(1)=F(2)=1。当然，如果加入更多已知的解，我们还能获得更高的性能，这和计算机中的时间与空间的交换不谋而合。具体计算过程很简单，就是保存已经计算过的子问题的解，在下次碰到重复子问题的时候可以直接查表使用，所以这种改进也叫带备忘录的动态规划算法。两个函数运行的效果对比如下：
```javascript
var number = 40;
var before = new Date().getTime();
console.log(fibonacci_dp(number));
console.log("fibonacci_dp runtime: " + (new Date().getTime() - before) + "ms");

before = new Date().getTime();
console.log(fibonacci_no(number));
console.log("fibonacci_no runtime: " + (new Date().getTime() - before) + "ms");
```
函数运行效果的对比：
![函数运行效果的对比][2]
&emsp;&emsp;可以看到，改用动态规划算法，性能提升了大约800倍。而且，随着计算数字的增大，其性能提升比会越来越大。

# **brainFuck语法编译器** #
> **brainFuck**语言是一门非常简单的基于栈的语言，只有以下几种操作符
"+": 指针指向单元数值自增1
"-": 指针指向单元数值自减1
">": 指针向右移动一格
"<": 指针向左移动一格
".": 输出指针指向的数值（ASCII码形式）
",": 接受输入的数值

&emsp;&emsp;虽然本算法称为编译器，但其实仅仅只是将原本的brainFuck语言转换成了javascript语言，并做了一些缩进，其目的只是为了好玩。利用这个brainFuck编译器，你可以写自己的brainFuck语言，比如一个*“Hello World！”*就可以是*“++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>>++.>+.+++++++..+++.<<++.>+++++++++++++++.>.+++.------.--------.<<+.<.”*这么长的奇怪代码。当然，要自己写一个这样像密码一般的字符串也不是一件容易的事，或许真的是件*brainFuck！*的事。权当娱乐，重在开心。

代码如下:
```javascript
function Compile(syntax, params) {
    'use strict';
    const MAXSIZE = 40;
    let cache = [], count = 0, code = undefined, i, memory = MAXSIZE;
    if (params && params.hasOwnProperty("memory") && params.memory > 0) {
        memory = params.memory;
    } else if (params) {
        for (i=0; i<params.length; i++)
            params[i] = paraseInt(params[i]) | 0;
    }
    
    let canDo = (x) => x == ">" || x == "<" || x == "+" || x == "-";
    let addp = (x) => "pointer+=" + x + ";";
    let subp = (x) => "pointer-=" + x + ";";
    let adder = (x) => "stack[pointer]+=" + x + ";";
    let suber = (x) => "stack[pointer]-=" + x + ";";
    let output = "output.push(stack[pointer]);";
    let input = (x) => "stack[pointer]=JSON.parse(" + JSON.stringify(x) + ");";
    let whs = "while(stack[pointer]){";
    let whe = "}";
    let debug = (x) => "console.log('stack memory:' + stack.join('|') + ' current pointer:' + pointer + ' at:' + " + x + ");";
    let record = { operating: NaN, count: NaN };

    syntax += "#";
    cache.push("let stack=[];");
    cache.push("stack.length=" + memory + ";");
    cache.push("stack.fill(0);");
    cache.push("let pointer=0;");
    cache.push("let output=[];");
    for (i = 0; i < syntax.length; i++) {
        if (record.operating == syntax[i]) {
            record.count++;
            continue;
        } else if (!!record.operating) {
            switch (record.operating) {
                case ">": cache.push(addp(record.count)); break;
                case "<": cache.push(subp(record.count)); break;
                case "+": cache.push(adder(record.count)); break;
                case "-": cache.push(suber(record.count)); break;
            }
        }
        if (canDo(syntax[i])) {
            record.operating = syntax[i];
            record.count = 1;
        } else {
            record.operating = record.count = NaN;
        }
        switch (syntax[i]) {
            case ",": cache.push(input(params[count++])); break;
            case "[": cache.push(whs); break;
            case "]": cache.push(whe); break;
            case ".": cache.push(output); break;
        }
        if (params &&
            params.hasOwnProperty("debug") &&
            params.debug &&
            (syntax[i] == "+" || syntax[i] == "-")) {
            cache.push(debug(i + 1));
        }
    }
    cache.push("for(let i=0;i<output.length;i++){output[i]=String.fromCharCode(output[i]);}");
    cache.push("console.log(output.join(''));");
    return {
        brainFuck: new Function(cache.join("")),
        codeLength: cache.length
    };
}

// Hello World!
var helloworld = Compile("++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>>++.>+.+++++++..+++.<<++.>+++++++++++++++.>.+++.------.--------.<<+.<.");
helloworld.brainFuck();
```
# **计算公式转逆波兰式（计算器原理）** #
> &emsp;&emsp;*逆波兰式*也叫也叫*后缀表达式*，之所以要转换为后缀表达式，原因就在于这个简单是相对人类的思维结构来说的，对计算机而言中序表达式是非常复杂的结构。相对的，逆波兰式在计算机看来却是比较简单易懂的结构。因为计算机普遍采用的内存结构是栈式结构，它执行先进后出的顺序。
&emsp;&emsp;所以，在计算机中运算这样的一个公式(123+abc)*d-(a+b)/e，我们一般先转化为逆波兰式，再在栈中求解计算。

代码如下:
```javascript
var classes = new Map();
classes.set('+', [5,  6]);
classes.set('-', [7,  8]);
classes.set('*', [1,  2]);
classes.set('/', [3,  4]);
classes.set('(', [11, 0]);
classes.set(')', [13, 12]);
classes.set('#', [14, 14]);

function check(sign) {
    if (sign == "#" || sign == "(" || sign == ")") {
        return false;
    }
    return true;
}

/**
 * 编译成逆波兰式
 * 
 * @param {*} str 计算公式 
 */
function compile(str) {
    let stack = [], output = "", pointer = 0, sign, pushIcon;
    str = "#"+str+"#";
    for (let i=0; i<str.length; i++) {
        if (!!classes.get(str[i])) {
            pushIcon = true;
            for(let j=stack.length-1; j>=0; j--) {
                let inLevel = classes.get(stack[stack.length - 1])[0];
                let outLevel = classes.get(str[i])[1];
                if (stack[stack.length - 1] == "(" && str[i] == ")") {
                    stack.pop();
                    pushIcon = false;
                    break;
                }
                if (inLevel < outLevel)
                    output += " " + stack.pop();
                else 
                    break;
            }
            if (stack[stack.length - 1] == "#" && str[i] == "#")
                 return output.split(" ").filter((x) => x!=="").join(" ");
            if (pushIcon) {
                stack.push(str[i]);
                output += " ";
            }
        } else {
            output+=str[i];
        }
    }
    console.err("equation is error!");
}

/**
 * 运算逆波兰式 
 * 
 * @param {*} equation 逆波兰式
 * @param {*} params 参数
 */
function run(equation, params) {
    let machine = equation.split(" ");
    let stack = [];
    for (let element of machine) {
        if (classes.get(element)) {
            let after = stack.pop();
            let before = stack.pop();
            switch(element) {
                case "+": stack.push(before + after);break;
                case "-": stack.push(before - after);break;
                case "*": stack.push(before * after);break;
                case "/": stack.push(before / after);break;
                default:
                     return new Error("can't calculate it!!!");
            }
        } else if (isNaN(element)) {
            if (params && params.hasOwnProperty(element))
                stack.push(params[element]);
            else
                return new Error("no this params!!!");
        } else
            stack.push(parseFloat(element));
    }
    return stack.pop();
}

var result = compile("(123+abc)*d-(a+b)/e");
console.log(result);
var value = run(result, {abc: 1, d: 1, a: 1, b: 1, e: 1});
console.log(value);
```
运行结果：
> 123 abc + d * a b + e / -
  122

  [1]: /assets/blogImg/blog2018-3-3.jpg
  [2]: /assets/blogImg/blog-dynamic-runtime.jpg