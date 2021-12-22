import React from './my-react/react/react'
import ReactDOM from './my-react/react-dom/react-dom'

class Demo extends React.Component {
  render() {
    return (
      <div>
        test
      </div>
    )
  }
}

ReactDOM.render(
  <Demo></Demo>,
  document.querySelector('#app')
)
