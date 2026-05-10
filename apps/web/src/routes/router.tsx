import { Route, Switch } from 'wouter'
import { Landing } from './landing'
import { Room } from './room'
import { Practice } from './practice'
import { Leaderboard } from './leaderboard'

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/practice" component={Practice} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/r/:code">{(params) => <Room code={params.code.toUpperCase()} />}</Route>
      <Route>
        <div className="flex h-full items-center justify-center text-gray-400">404</div>
      </Route>
    </Switch>
  )
}
