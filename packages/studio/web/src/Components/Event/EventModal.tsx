import React, { Fragment, useRef, useState } from 'react'

import { Transition, Dialog } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import {
  Bold,
  Button,
  Card,
  Flex,
  List,
  ListItem,
  Text,
  Title,
} from '@tremor/react'

import { displayTextOrJSON } from '../../util/ui'

function DetailsModel({ open, setOpen, event }: any) {
  const cancelButtonRef = useRef(null)
  const data = Object.entries(event.attributes ?? {}).map(([name, value]) => ({
    name,
    value,
  }))
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={setOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <Flex className="flex-col items-start">
                  <Title>Event Information</Title>
                  <List className="">
                    <ListItem>
                      <Text>Name</Text>
                      {event.name}
                    </ListItem>
                    <ListItem>
                      <Text>Time</Text>
                      {new Date(Number(event.time / BigInt(1e6))).toISOString()}
                    </ListItem>
                  </List>
                  <Text className="mt-4">
                    <Bold>Attributes</Bold>
                  </Text>
                  <List>
                    {data?.map((d) => (
                      <ListItem key={d.name}>
                        <Text>{d.name}</Text>
                        {displayTextOrJSON(d.value)}
                      </ListItem>
                    ))}
                  </List>
                  <Flex justifyContent="end" className="space-x-2 mt-4">
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => setOpen(false)}
                    >
                      Close
                    </Button>
                  </Flex>
                </Flex>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default function EventModal({ event }: { event: any }) {
  const [open, setOpen] = useState(false)

  const attributeCount = Object.keys(event.attributes || {}).length
  return (
    <Card className="min-w-full px-4 py-2">
      <Flex className="space-x-3">
        <div className="flex-1 flex-col items-start min-w-0">
          <Text>
            <Bold className="mr-1">{event.name}</Bold>(
            {attributeCount === 1
              ? '1 attribute'
              : `${attributeCount} attributes`}
            )
          </Text>
          <Text>
            {new Date(Number(event.time / BigInt(1e6))).toISOString()}
          </Text>
        </div>
        <MagnifyingGlassIcon
          className="h-5 w-5 text-cyan-400 hover:cursor-pointer"
          onClick={() => setOpen(true)}
        />
        <DetailsModel open={open} setOpen={setOpen} event={event} />
      </Flex>
    </Card>
  )
}
