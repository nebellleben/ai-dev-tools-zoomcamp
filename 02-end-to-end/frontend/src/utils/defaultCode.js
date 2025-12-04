// Default code templates for different programming languages

export const DEFAULT_CODE = {
  javascript: `// Welcome to the coding interview platform!
// Start coding here...

function hello() {
  console.log("Hello, World!");
}

hello();`,

  python: `# Welcome to the coding interview platform!
# Start coding here...

def hello():
    print("Hello, World!")

if __name__ == "__main__":
    hello()`,

  java: `// Welcome to the coding interview platform!
// Start coding here...

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,

  cpp: `// Welcome to the coding interview platform!
// Start coding here...

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,

  csharp: `// Welcome to the coding interview platform!
// Start coding here...

using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,

  go: `// Welcome to the coding interview platform!
// Start coding here...

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,

  rust: `// Welcome to the coding interview platform!
// Start coding here...

fn main() {
    println!("Hello, World!");
}`,

  typescript: `// Welcome to the coding interview platform!
// Start coding here...

function hello(): void {
    console.log("Hello, World!");
}

hello();`,
};

export const getDefaultCode = (language) => {
  return DEFAULT_CODE[language] || DEFAULT_CODE.javascript;
};

