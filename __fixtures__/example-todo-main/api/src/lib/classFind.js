class MyParentClass {
  find() {
    return 'foo';
  }
}

class MyChildClass extends MyParentClass {
  find() {
    return super.find();
  }
}
