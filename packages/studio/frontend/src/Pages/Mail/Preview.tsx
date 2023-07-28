import React from 'react'
// import React, { useState } from 'react'

// import { gql, useQuery } from '@apollo/client'
// import {
//   Title,
//   Text,
//   Card,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeaderCell,
//   TableRow,
// } from '@tremor/react'

// import LoadingSpinner from '../../Components/LoadingSpinner'
// import ErrorPanel from '../../Components/Panels/ErrorPanel'
// import { LIST_POLLING_INTERVAL } from '../../util/polling'

// const QUERY_GET_MAIL_TEMPLATES = gql`
//   query GetMailTemplates {
//     mailTemplateFiles {
//       path
//       name
//     }
//   }
// `

// const QUERY_GET_MAIL_TEMPLATE = gql`
//   query GetMailTemplate($templatePath: String!) {
//     mailTemplateFileExports(templatePath: $templatePath)
//   }
// `

function MailPreview() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-slate-600">
            Coming soon...
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-rich-black sm:text-4xl">
            Mail Template Previews
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Easily preview your mail templates in development so you can craft
            the perfect messages to your users. View any of your templates, fill
            in example data and see the mail right here live in studio.
          </p>
        </div>
      </div>
    </div>
  )

  // const [selectedTemplate, setSelectedTemplate] = useState<any | undefined>()
  // const [selectedTemplateExport, setSelectedTemplateExport] = useState<
  //   string | undefined
  // >()

  // const { loading, error, data } = useQuery(QUERY_GET_MAIL_TEMPLATES, {
  //   pollInterval: LIST_POLLING_INTERVAL,
  //   fetchPolicy: 'no-cache',
  // })

  // const mailTemplateQuery = useQuery(QUERY_GET_MAIL_TEMPLATE, {
  //   pollInterval: LIST_POLLING_INTERVAL,
  //   variables: {
  //     templatePath: selectedTemplate?.path,
  //   },
  //   skip: selectedTemplate === undefined,
  //   fetchPolicy: 'no-cache',
  // })

  // if (error) {
  //   return <ErrorPanel error={error} />
  // }

  // if (loading) {
  //   return (
  //     <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
  //       <LoadingSpinner />
  //     </div>
  //   )
  // }

  // return (
  //   <div className="p-6 h-full">
  //     <Title>Mail Template Preview</Title>
  //     <Text>
  //       RedwoodJS Studio can detect all your mail templates and provide previews
  //       of how they look when rendered. You can supply the necessary input and
  //       see the mail right here live in studio.
  //     </Text>

  //     <Card className="mt-6 max-h-[33vh] overflow-y-auto">
  //       <Title>Templates</Title>
  //       {/* TODO: Add some filtering ability */}
  //       <Table>
  //         <TableHead>
  //           <TableRow>
  //             <TableHeaderCell>Name</TableHeaderCell>
  //             <TableHeaderCell>Path</TableHeaderCell>
  //           </TableRow>
  //         </TableHead>

  //         <TableBody>
  //           {data?.mailTemplateFiles?.map((templateFile: any) => (
  //             <TableRow
  //               key={templateFile.path}
  //               className={`${
  //                 selectedTemplate?.path === templateFile.path
  //                   ? 'bg-gray-200'
  //                   : ''
  //               } cursor-pointer`}
  //               onClick={() => setSelectedTemplate(templateFile)}
  //             >
  //               <TableCell>{templateFile.name}</TableCell>
  //               <TableCell>{templateFile.path}</TableCell>
  //             </TableRow>
  //           ))}
  //         </TableBody>
  //       </Table>
  //       {data?.mailTemplateFiles?.length === 0 && (
  //         <Text className="text-center pt-3">No mail templates found...</Text>
  //       )}
  //     </Card>

  //     <Card className="mt-6 max-h-[33vh] overflow-y-auto">
  //       <Title>Template Exports</Title>
  //       {/* TODO: Add some filtering ability */}
  //       <Table>
  //         <TableHead>
  //           <TableRow>
  //             <TableHeaderCell>Name</TableHeaderCell>
  //           </TableRow>
  //         </TableHead>

  //         <TableBody>
  //           {mailTemplateQuery?.data?.mailTemplateFileExports?.map(
  //             (templateExport: any) => (
  //               <TableRow
  //                 key={templateExport}
  //                 className={`${
  //                   selectedTemplateExport === templateExport
  //                     ? 'bg-gray-200'
  //                     : ''
  //                 } cursor-pointer`}
  //                 onClick={() => setSelectedTemplateExport(templateExport)}
  //               >
  //                 <TableCell>{templateExport}</TableCell>
  //               </TableRow>
  //             )
  //           )}
  //         </TableBody>
  //       </Table>
  //       {mailTemplateQuery?.data === undefined && (
  //         <Text className="text-center pt-3">
  //           No exports found in the template...
  //         </Text>
  //       )}
  //     </Card>
  //   </div>
  // )
}

export default MailPreview
