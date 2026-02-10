# Swift 语言基础入门

欢迎来到 Swift 的世界！Swift 是一门由 Apple 开发的强大且直观的编程语言，用于构建 iOS、macOS、tvOS 和 watchOS 应用程序。它设计得既安全又快速，深受开发者喜爱。

本文档将带你快速了解 Swift 的基础语法。

## 1. 变量与常量

Swift 使用 `var` 声明变量，使用 `let` 声明常量。**推荐优先使用常量**，因为它能让代码更安全、更清晰。

```swift
var myVariable = 42
myVariable = 50 // 变量可以修改

let myConstant = 42
// myConstant = 50 // ❌ 报错：常量一旦赋值不可修改
```

Swift 支持**类型推断**，通常不需要显式指定类型。

```swift
let implicitInteger = 70    // 推断为 Int
let implicitDouble = 70.0   // 推断为 Double
let explicitDouble: Double = 70 // 显式指定为 Double
```

## 2. 基础数据类型

- **Int**: 整数
- **Double** / **Float**: 浮点数
- **String**: 字符串
- **Bool**: 布尔值 (true / false)

### 字符串插值

在字符串中插入变量非常简单，使用 `\()`：

```swift
let apples = 3
let summary = "我有 \(apples) 个苹果。" // "我有 3 个苹果。"
```

## 3. 控制流

### 条件语句 (If / Switch)

```swift
let score = 85

if score > 90 {
    print("优秀")
} else if score > 60 {
    print("及格")
} else {
    print("不及格")
}
```

`Switch` 语句非常强大，不仅支持整数，还支持字符串、区间等，且不需要写 `break`。

```swift
let fruit = "Apple"
switch fruit {
case "Apple":
    print("是苹果")
case "Banana", "Orange":
    print("是香蕉或橘子")
default:
    print("其他水果")
}
```

### 循环 (For-In / While)

```swift
let names = ["Anna", "Alex", "Brian", "Jack"]
for name in names {
    print("你好, \(name)!")
}

// 范围循环
for i in 1...5 {
    print(i) // 输出 1 到 5
}
```

## 4. 函数 (Functions)

使用 `func` 关键字定义函数。

```swift
func greet(person: String, day: String) -> String {
    return "Hello \(person), today is \(day)."
}

let message = greet(person: "Bob", day: "Tuesday")
```

参数标签默认即为参数名，但也可以自定义参数标签（或使用 `_` 忽略标签）：

```swift
func add(_ n1: Int, to n2: Int) -> Int {
    return n1 + n2
}
// 调用时读起来更像自然语言
let sum = add(5, to: 3)
```

## 5. 结构体与类 (Struct & Class)

Swift 中 `struct` (结构体) 和 `class` (类) 很像，都可以有属性和方法。

- **Struct**: 值类型 (Value Type)，传递时会**复制**一份。SwiftUI 中 View 主要是 Struct。
- **Class**: 引用类型 (Reference Type)，传递时传递的是**引用**。

```swift
struct Task {
    var title: String
    var isCompleted: Bool
}

var task1 = Task(title: "写代码", isCompleted: false)
// 修改 task1 不会影响 task1 的副本（如果有的话）
```

## 6. 可选类型 (Optionals)

这是 Swift 最重要的特性之一。`Optional` 表示一个变量**可能有值**，也可能**是 nil (没有值)**。类型后面加 `?` 表示可选。

```swift
var optionalName: String? = "John Appleseed"
// optionalName = nil // 合法

// 安全解包 (If-Let)
if let name = optionalName {
    print("Hello, \(name)") // 这里的 name 是非可选的 String
} else {
    print("没有名字")
}

// 强制解包 (不推荐，除非你非常确定有值)
// print(optionalName!)
```

## 7. 简单的 SwiftUI 示例

SwiftUI 是 Apple 最新的声明式 UI 框架。

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Image(systemName: "globe")
                .imageScale(.large)
                .foregroundStyle(.tint)
            Text("Hello, world!")
        }
        .padding()
    }
}
```

## 总结

这只是 Swift 的冰山一角。它还有闭包 (Closures)、枚举 (Enums)、协议 (Protocols)、扩展 (Extensions) 等强大的特性等待你去探索。

**下一步建议**：

1. 打开 Xcode 创建一个 Playground。
2. 将上面的代码复制进去运行试试。
3. 尝试修改变量值，观察控制台输出。
