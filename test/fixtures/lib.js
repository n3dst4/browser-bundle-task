/*globals done*/
export default function () {
  // when the test runs, it inserts done as a function in global context
  // calling it here indicates that the code pipeline is complete
  done()
}
