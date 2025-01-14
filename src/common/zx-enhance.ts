import { chalk, ProcessOutput, ProcessPromise, question } from 'zx'
import { env } from './envalid'
import { DebugStream, getParsedArgs } from './utils'

const MAX_RETRIES_QUESTION = 3

export type AskType = {
  choices?: string[]
  matching?: string[]
  matchingFn?: (answer: string) => boolean | Promise<boolean>
  defaultAnswer?: string
  maxRetries?: number
}

/**
 * Extends the zx `question` function, to not only offer autocomplete (choices) but also force an answer to match, and limit the number of retries.
 * the original `question` function doesn't limit the number of tries, and accepts invalid input
 * @param query
 * @param choices
 * @param matching
 * @param maxRetriesOrDefaultAnswer
 * @returns
 */
export const ask = async (query: string, options?: AskType): Promise<string> => {
  const choices = options?.choices ?? []
  const matching = options?.matching ?? []
  const defaultAnswer = options?.defaultAnswer ?? ''
  const maxRetries = options?.maxRetries ?? MAX_RETRIES_QUESTION

  if (!getParsedArgs() || getParsedArgs().nonInteractive) return defaultAnswer

  const defaultMatchingFn = (answer: string) =>
    [...new Set(matching.map((val) => val.toLowerCase()))].includes(answer.toLowerCase())
  const matchingFn = options?.matchingFn ?? defaultMatchingFn

  if (env.CI) return defaultAnswer
  let answer = ''
  let tries = 0
  let matches = false
  /* eslint-disable no-await-in-loop */
  do {
    answer = await question(`${query}\n> `, { choices })
    matches = await matchingFn(answer)
    tries += 1
    if (answer?.length === 0 && defaultAnswer.length > 0) return defaultAnswer
    if (tries >= maxRetries) throw new Error(`Max retries for: ${chalk.italic(query)}`)
  } while (answer.length <= 0 || !matches)
  /* eslint-enable no-await-in-loop */
  return answer
}

export const askYesNo = async (query: string, option?: { defaultYes?: boolean }): Promise<boolean> => {
  const defaultAnswer = option?.defaultYes ? 'yes' : 'no'
  const defaults = option?.defaultYes ? 'Yes/no' : 'yes/No'
  const yes = ['y', 'yes']
  const matching = [...yes, 'n', 'no', '']
  const answer = await ask(`${query} [${defaults}]`, {
    choices: ['Yes', 'No'],
    matching,
    defaultAnswer,
  })

  return yes.includes(answer.length > 0 ? answer : defaultAnswer)
}

export type Streams = {
  stdout?: DebugStream
  stderr?: DebugStream
}
export const stream = (cmd: ProcessPromise<ProcessOutput>, streams?: Streams): ProcessPromise<ProcessOutput> => {
  if (streams?.stdout) cmd.stdout.pipe(streams.stdout, { end: false })
  if (streams?.stderr) cmd.stderr.pipe(streams.stderr, { end: false })
  return cmd
}

export class ProcessOutputTrimmed {
  #po: ProcessOutput

  constructor(processOutput: ProcessOutput) {
    this.#po = processOutput
  }

  get exitCode(): number {
    return this.#po.exitCode
  }

  get stdout(): string {
    return this.#po.stdout.trim()
  }

  get stderr(): string {
    return this.#po.stderr.trim()
  }

  toString(): string {
    return this.#po.toString()
  }
}
