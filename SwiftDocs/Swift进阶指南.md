# Swift 进阶指南

掌握了基础语法后，让我们深入探索 Swift 的核心高级特性。这些特性展示了 Swift 真正的强大之处，特别是在架构设计和并发编程方面。

## 1. 闭包 (Closures)

闭包是自包含的功能代码块，可以在代码中被传递和使用。它类似于其他语言中的 Lambda 表达式。

```swift
let numbers = [5, 2, 9, 1]

// 标准写法
let sortedNumbers = numbers.sorted(by: { (n1: Int, n2: Int) -> Bool in
    return n1 < n2
})

// 简写语法 (Trailing Closure)
// 如果闭包是函数的最后一个参数，可以直接写在括号外面
// $0, $1 代表第一个、第二个参数
let simpleSorted = numbers.sorted { $0 < $1 }
```

## 2. 枚举 (Enums) - 超强版

Swift 的枚举不仅仅是整数列表，它们可以携带相关值 (Associated Values) 和方法。

```swift
enum ResultState {
    case success(String)
    case failure(Int, String) // 错误码，错误信息
}

let requestResult = ResultState.failure(404, "Not Found")

switch requestResult {
case .success(let message):
    print("成功: \(message)")
case .failure(let code, let error):
    print("失败: \(code) - \(error)")
}
```

## 3. 协议与扩展 (Protocols & Extensions)

Swift 被称为"面向协议的编程语言" (Protocol-Oriented Programming)。

### 协议 (Protocol)

定义一套蓝图（接口），规定了属性和方法。

```swift
protocol Identifiable {
    var id: String { get }
    func identify()
}
```

### 扩展 (Extension)

为现有的类、结构体、枚举甚至协议添加新功能，无需继承。

```swift
extension String {
    // 给 String 添加一个新方法，判断是否是空或只包含空格
    var isBlank: Bool {
        return self.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}

let testStr = "   "
print(testStr.isBlank) // true
```

## 4. 错误处理 (Error Handling)

使用 `do-try-catch` 模式来处理可能抛出的错误。

```swift
enum FileError: Error {
    case fileNotFound
    case unreadable
}

func readFile(name: String) throws -> String {
    if name == "" { throw FileError.fileNotFound }
    return "File Content"
}

do {
    let content = try readFile(name: "data.txt")
    print(content)
} catch FileError.fileNotFound {
    print("错误：找不到文件")
} catch {
    print("未知错误: \(error)")
}
```

## 5. 泛型 (Generics)

泛型让你能编写灵活、可重用的函数和类型。

```swift
// 一个交换任意两个值的函数
func swapTwoValues<T>(_ a: inout T, _ b: inout T) {
    let temporaryA = a
    a = b
    b = temporaryA
}

var a = 10
var b = 20
swapTwoValues(&a, &b) // T 推断为 Int

var str1 = "Hello"
var str2 = "World"
swapTwoValues(&str1, &str2) // T 推断为 String
```

## 6. 并发编程 (Concurrency) - async/await

Swift 5.5+ 引入了现代化的结构化并发。

### 异步函数

```swift
func fetchUserData(userId: String) async throws -> String {
    // 模拟网络请求
    try await Task.sleep(nanoseconds: 1 * 1_000_000_000) // 睡1秒
    return "User: \(userId)"
}
```

### 调用异步函数

通常在 `Task` 上下文中调用。

```swift
Task {
    do {
        let user = try await fetchUserData(userId: "123")
        print(user)
    } catch {
        print("获取用户失败")
    }
}
```

### Actor 模型

`actor` 是一种引用类型，类似于 class，但它是**线程安全**的。它可以防止数据竞争。

```swift
actor UserStore {
    var users: [String] = []

    func addUser(_ name: String) {
        users.append(name)
    }
}

// 访问 actor 的属性或方法必须用 await
let store = UserStore()
Task {
    await store.addUser("Alice")
}
```

## 总结

这份进阶指南涵盖了 Swift 开发中不可或缺的工具：

1.  **闭包** 让代码更简洁。
2.  **枚举** 处理状态极其强大。
3.  **协议与扩展** 是 Swift 架构的灵魂。
4.  **async/await** 让异步代码像同步代码一样易读。

掌握这些，你就具备了构建复杂 Swift 应用的能力！
